import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { EncryptionService } from '@src/encryption/encryption.service';
import { AuthSessionsService } from '../auth-sessions.service';
import { AuthSessionEntity } from '../entities';
import { REFRESH_TOKEN_OVERLAP_MS } from '../constants';

describe('AuthSessionsService', () => {
  let service: AuthSessionsService;
  let encryptionService: EncryptionService;

  const mockSessionsRepository = {
    create: jest.fn((v) => v),
    save: jest.fn((v) => Promise.resolve(v)),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEncryptionService = {
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
  };

  let queryBuilderState: {
    session: Partial<AuthSessionEntity> | undefined;
    saved: AuthSessionEntity[];
  };

  const buildManager = (session: Partial<AuthSessionEntity> | undefined) => {
    const repoSave = jest.fn((entity) => {
      queryBuilderState.saved.push(entity);
      return Promise.resolve(entity);
    });

    const qb = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(session),
    };

    return {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
        save: repoSave,
      }),
    };
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    queryBuilderState = { session: undefined, saved: [] };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSessionsService,
        {
          provide: getRepositoryToken(AuthSessionEntity),
          useValue: mockSessionsRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<AuthSessionsService>(AuthSessionsService);
    encryptionService = module.get<EncryptionService>(EncryptionService);

    mockDataSource.transaction.mockImplementation(async (cb) => {
      const manager = buildManager(queryBuilderState.session);
      return cb(manager as never);
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(encryptionService).toBeDefined();
  });

  describe('create', () => {
    const buildCreateRepo = (activeSessions: Partial<AuthSessionEntity>[]) => {
      const deleteExecute = jest.fn().mockResolvedValue({ affected: 0 });
      const deleteQb = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: deleteExecute,
      };

      const selectQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(activeSessions),
      };

      const updateExecute = jest.fn().mockResolvedValue({ affected: 0 });
      const updateQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        execute: updateExecute,
      };

      let calls = 0;
      const repo = {
        create: jest.fn((v) => v),
        save: jest.fn((v) => Promise.resolve(v)),
        createQueryBuilder: jest.fn((alias?: string) => {
          calls += 1;
          if (calls === 1) return deleteQb;
          if (alias === 'session') return selectQb;
          return updateQb;
        }),
      };

      return { repo, deleteExecute, selectQb, updateQb };
    };

    it('persists a new session row and hard-deletes stale rows for the user', async () => {
      const expiresAt = new Date(Date.now() + 604800_000);
      const { repo, deleteExecute } = buildCreateRepo([]);

      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb({ getRepository: () => repo } as never),
      );

      const result = await service.create({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt,
      });

      expect(deleteExecute).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-1',
          userId: 'user-1',
          currentTokenHash: 'hash',
          previousTokenHash: null,
          revokedAt: null,
          expiresAt,
        }),
      );
      expect(result).toMatchObject({ id: 'session-1' });
    });

    it('revokes the oldest active sessions beyond the cap', async () => {
      const expiresAt = new Date(Date.now() + 604800_000);
      const activeSessions = Array.from({ length: 11 }, (_, i) => ({
        id: `session-${i}`,
        createdAt: new Date(i),
      })) as AuthSessionEntity[];
      const { repo, updateQb } = buildCreateRepo(activeSessions);

      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb({ getRepository: () => repo } as never),
      );

      await service.create({
        id: 'session-new',
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt,
      });

      expect(updateQb.whereInIds).toHaveBeenCalledWith(['session-0']);
    });
  });

  describe('verifyAndRotate', () => {
    it('returns not_found when the session does not exist', async () => {
      queryBuilderState.session = undefined;

      const result = await service.verifyAndRotate('sid', 'token', 'newHash');

      expect(result).toEqual({ outcome: 'not_found' });
    });

    it('returns revoked for an already-revoked session', async () => {
      queryBuilderState.session = {
        id: 'sid',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      };

      const result = await service.verifyAndRotate('sid', 'token', 'newHash');

      expect(result).toEqual({ outcome: 'revoked' });
    });

    it('returns expired for a session past its absolute expiry', async () => {
      queryBuilderState.session = {
        id: 'sid',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        currentTokenHash: 'current-hash',
        previousTokenHash: null,
        previousTokenExpiresAt: null,
      };

      const result = await service.verifyAndRotate('sid', 'token', 'newHash');

      expect(result).toEqual({ outcome: 'expired' });
    });

    it('rotates when the presented token matches the current hash', async () => {
      queryBuilderState.session = {
        id: 'sid',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        currentTokenHash: 'current-hash',
        previousTokenHash: null,
        previousTokenExpiresAt: null,
      };
      mockEncryptionService.validatePassword.mockResolvedValueOnce(true);

      const result = await service.verifyAndRotate('sid', 'token', 'newHash');

      expect(result.outcome).toBe('rotated');
      expect(queryBuilderState.saved[0]).toMatchObject({
        currentTokenHash: 'newHash',
        previousTokenHash: 'current-hash',
      });
    });

    it('accepts the previous token within the overlap window without rotating', async () => {
      const previousExpiresAt = new Date(
        Date.now() + REFRESH_TOKEN_OVERLAP_MS - 1000,
      );
      queryBuilderState.session = {
        id: 'sid',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        currentTokenHash: 'current-hash',
        previousTokenHash: 'previous-hash',
        previousTokenExpiresAt: previousExpiresAt,
      };
      mockEncryptionService.validatePassword
        .mockResolvedValueOnce(false) // current mismatch
        .mockResolvedValueOnce(true); // previous matches

      const result = await service.verifyAndRotate('sid', 'token', 'newHash');

      expect(result.outcome).toBe('accepted_previous');
      expect(queryBuilderState.saved[0]).toMatchObject({
        currentTokenHash: 'current-hash',
        previousTokenHash: 'previous-hash',
      });
    });

    it('revokes the session and reports replayed for a stale/unknown token', async () => {
      queryBuilderState.session = {
        id: 'sid',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        currentTokenHash: 'current-hash',
        previousTokenHash: 'previous-hash',
        previousTokenExpiresAt: new Date(Date.now() - 1000), // overlap elapsed
      };
      mockEncryptionService.validatePassword.mockResolvedValue(false);

      const result = await service.verifyAndRotate('sid', 'token', 'newHash');

      expect(result).toEqual({ outcome: 'replayed' });
      expect(queryBuilderState.saved[0]).toMatchObject({
        revokedAt: expect.any(Date),
      });
    });
  });

  describe('revokeCurrent', () => {
    it('marks the session revoked', async () => {
      await service.revokeCurrent('sid');

      expect(mockSessionsRepository.update).toHaveBeenCalledWith(
        { id: 'sid' },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});
