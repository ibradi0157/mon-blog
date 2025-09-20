// src/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Article } from '../articles/article.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  displayName: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationCodeHash?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationCodeExpiresAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  resetPasswordTokenId?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordTokenHash?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpiresAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockUntil?: Date | null;

  @ManyToOne(() => Role, { eager: true })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
