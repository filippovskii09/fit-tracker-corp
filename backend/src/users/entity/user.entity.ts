import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { IUserSecure } from '../types';

@Entity('users')
export class UserEntity implements IUserSecure {
  @PrimaryColumn()
  id!: string;

  @Column()
  firstName!: string;

  @Column({ unique: true, type: 'varchar' })
  email!: string;

  @Column({ select: false, type: 'varchar' })
  passwordHash!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
