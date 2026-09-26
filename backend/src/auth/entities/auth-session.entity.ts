import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@src/users/entity';

@Entity('auth_sessions')
export class AuthSessionEntity {
  @PrimaryColumn()
  id!: string;

  @Index('IDX_auth_sessions_userId')
  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'FK_auth_sessions_userId',
  })
  user!: UserEntity;

  @Column({ type: 'varchar', select: false })
  currentTokenHash!: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  previousTokenHash!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  previousTokenExpiresAt!: Date | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
