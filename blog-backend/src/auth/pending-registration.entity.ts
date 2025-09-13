// src/auth/pending-registration.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { RoleName } from '../roles/roles.constants';

@Entity()
export class PendingRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', length: 32 })
  roleName: RoleName; // Typically SIMPLE_USER

  @Column({ type: 'varchar', length: 255, nullable: true })
  verificationCodeHash?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationCodeExpiresAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
