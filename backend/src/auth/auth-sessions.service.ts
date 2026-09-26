import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, EntityManager, Repository } from 'typeorm';

import { EncryptionService } from '@src/encryption/encryption.service';
import { AuthSessionEntity } from './entities';
import { REFRESH_TOKEN_OVERLAP_MS } from './constants';

const MAX_USER_AGENT_LENGTH = 256;
/** Cap on active (non-revoked, non-expired) sessions per user. */
const MAX_ACTIVE_SESSIONS_PER_USER = 10;
/** Hard-delete sessions expired/revoked for longer than this. */
const STALE_SESSION_RETENTION_DAYS = 7;

export type RotateOutcome =
  | { outcome: 'not_found' }
  | { outcome: 'revoked' }
  | { outcome: 'expired' }
  | { outcome: 'rotated'; session: AuthSessionEntity }
  | { outcome: 'accepted_previous'; session: AuthSessionEntity }
  | { outcome: 'replayed' };

@Injectable()
export class AuthSessionsService {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly sessionsRepository: Repository<AuthSessionEntity>,
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Creates a new session and, within the same transaction, garbage-collects
   * this user's session history: rows expired/revoked for more than
   * `STALE_SESSION_RETENTION_DAYS` are hard-deleted, and active sessions
   * beyond `MAX_ACTIVE_SESSIONS_PER_USER` are revoked oldest-first. Runs in
   * its own transaction unless an existing one is passed in (e.g. the
   * legacy-refresh upgrade in AuthService, which must clear the legacy hash
   * and create the session atomically).
   */
  async create(
    params: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      userAgent?: string | null;
    },
    manager?: EntityManager,
  ): Promise<AuthSessionEntity> {
    const run = async (m: EntityManager): Promise<AuthSessionEntity> => {
      const repo = m.getRepository(AuthSessionEntity);

      await repo
        .createQueryBuilder()
        .delete()
        .from(AuthSessionEntity)
        .where('"userId" = :userId', { userId: params.userId })
        .andWhere(
          `(("revokedAt" IS NOT NULL AND "revokedAt" <= now() - interval '${STALE_SESSION_RETENTION_DAYS} days') ` +
            `OR ("expiresAt" <= now() - interval '${STALE_SESSION_RETENTION_DAYS} days'))`,
        )
        .execute();

      const session = repo.create({
        id: params.id,
        userId: params.userId,
        currentTokenHash: params.tokenHash,
        previousTokenHash: null,
        previousTokenExpiresAt: null,
        expiresAt: params.expiresAt,
        revokedAt: null,
        lastUsedAt: new Date(),
        userAgent: params.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
      });
      const saved = await repo.save(session);

      const active = await repo
        .createQueryBuilder('session')
        .where('session.userId = :userId', { userId: params.userId })
        .andWhere('session.revokedAt IS NULL')
        .andWhere('session.expiresAt > now()')
        .orderBy('session.createdAt', 'ASC')
        .getMany();

      if (active.length > MAX_ACTIVE_SESSIONS_PER_USER) {
        const excessIds = active
          .slice(0, active.length - MAX_ACTIVE_SESSIONS_PER_USER)
          .map((s) => s.id);

        await repo
          .createQueryBuilder()
          .update(AuthSessionEntity)
          .set({ revokedAt: () => 'now()' })
          .whereInIds(excessIds)
          .execute();
      }

      return saved;
    };

    if (manager) return run(manager);
    return this.dataSource.transaction(run);
  }

  async findActive(id: string): Promise<AuthSessionEntity | null> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
    });

    if (!session || session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;

    return session;
  }

  async revokeCurrent(id: string): Promise<void> {
    await this.sessionsRepository.update({ id }, { revokedAt: new Date() });
  }

  /**
   * Verifies a presented refresh token against the addressed session and
   * atomically rotates the credential. Runs inside a row-locking transaction
   * so two concurrent refresh attempts for the same session cannot both
   * observe/rotate the same credential.
   */
  async verifyAndRotate(
    sessionId: string,
    presentedToken: string,
    newTokenHash: string,
  ): Promise<RotateOutcome> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const repo = manager.getRepository(AuthSessionEntity);

      const session = await repo
        .createQueryBuilder('session')
        .addSelect(['session.currentTokenHash', 'session.previousTokenHash'])
        .where('session.id = :sessionId', { sessionId })
        .setLock('pessimistic_write')
        .getOne();

      if (!session) return { outcome: 'not_found' };
      if (session.revokedAt) return { outcome: 'revoked' };

      const now = new Date();
      if (session.expiresAt.getTime() <= now.getTime()) {
        return { outcome: 'expired' };
      }

      const currentMatches = await this.encryptionService.validatePassword(
        session.currentTokenHash,
        presentedToken,
      );

      if (currentMatches) {
        session.previousTokenHash = session.currentTokenHash;
        session.previousTokenExpiresAt = new Date(
          now.getTime() + REFRESH_TOKEN_OVERLAP_MS,
        );
        session.currentTokenHash = newTokenHash;
        session.lastUsedAt = now;
        await repo.save(session);
        return { outcome: 'rotated', session };
      }

      const withinOverlap =
        !!session.previousTokenHash &&
        !!session.previousTokenExpiresAt &&
        session.previousTokenExpiresAt.getTime() > now.getTime();

      if (withinOverlap) {
        const previousMatches = await this.encryptionService.validatePassword(
          session.previousTokenHash!,
          presentedToken,
        );

        if (previousMatches) {
          session.lastUsedAt = now;
          await repo.save(session);
          return { outcome: 'accepted_previous', session };
        }
      }

      // Anything else presented against this session is a replay of an
      // already-rotated (and now stale) credential, or an invalid token
      // altogether: terminal, and revokes the session per the overlap policy.
      session.revokedAt = now;
      await repo.save(session);
      return { outcome: 'replayed' };
    });
  }
}
