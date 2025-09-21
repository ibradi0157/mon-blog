// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RoleName } from '../roles/roles.constants';
import { Permissions } from '../roles/permissions';
import { Role } from '../roles/role.entity';
import { randomInt, randomUUID } from 'crypto';
import { PendingRegistration } from './pending-registration.entity';
import { MailerService } from '../mail/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(PendingRegistration) private pendingRepo: Repository<PendingRegistration>,
    private jwtService: JwtService,
    private mailer: MailerService,
    private config: ConfigService,
  ) {}

  private async ensureRole(name: RoleName): Promise<Role> {
    let role = await this.roleRepo.findOne({ where: { name } });
    if (!role) {
      role = this.roleRepo.create({ name });
      role = await this.roleRepo.save(role);
    }
    return role;
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) throw new UnauthorizedException('Cet email est déjà utilisé');

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    const usersCount = await this.userRepo.count();
    let roleName: RoleName;
    if (usersCount === 0 && Permissions[RoleName.PRIMARY_ADMIN].isProtected) {
      roleName = RoleName.PRIMARY_ADMIN;
    } else {
      roleName = RoleName.SIMPLE_USER;
    }

    // If first user must be PRIMARY_ADMIN (or any non SIMPLE_USER), create immediately
    if (roleName !== RoleName.SIMPLE_USER) {
      const roleEntity = await this.ensureRole(roleName);
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = this.userRepo.create({
        email: dto.email,
        displayName: dto.displayName,
        password: hashedPassword,
        isEmailVerified: true,
        role: roleEntity,
      });
      await this.userRepo.save(user);
      return { success: true, message: 'Inscription réussie.', data: { email: user.email, role: user.role.name } };
    }

    // SIMPLE_USER: create or update a pending registration with a 45-minute code
    const existingPending = await this.pendingRepo.findOne({ where: { email: dto.email } });
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const verificationCodeHash = await bcrypt.hash(code, 10);
    const exp = new Date();
    exp.setMinutes(exp.getMinutes() + 45);

    if (!existingPending) {
      const pending = this.pendingRepo.create({
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
        roleName,
        verificationCodeHash,
        verificationCodeExpiresAt: exp,
      });
      await this.pendingRepo.save(pending);
    } else {
      existingPending.displayName = dto.displayName;
      existingPending.passwordHash = passwordHash;
      existingPending.roleName = roleName;
      existingPending.verificationCodeHash = verificationCodeHash;
      existingPending.verificationCodeExpiresAt = exp;
      await this.pendingRepo.save(existingPending);
    }
    try {
      await this.mailer.sendVerificationCode(dto.email, code, exp);
    } catch (e) {
      // swallow email errors to avoid blocking registration initiation
    }
    return {
      success: true,
      message: 'Inscription initiée. Un code de vérification a été envoyé à votre email.',
      data: { email: dto.email, expiresAt: exp.toISOString() },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      // Avoid user enumeration
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Account lockout check
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      throw new UnauthorizedException('Compte verrouillé temporairement. Réessayez plus tard.');
    }

    const passOk = await bcrypt.compare(dto.password, user.password);
    if (!passOk) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 13) {
        const lock = new Date();
        lock.setMinutes(lock.getMinutes() + 2);
        user.lockUntil = lock;
        user.failedLoginAttempts = 0;
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Successful login: reset counters
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Only enforce email verification for SIMPLE_USER
    if (user.role?.name === RoleName.SIMPLE_USER && !user.isEmailVerified) {
      await this.userRepo.save(user);
      throw new UnauthorizedException('Email non vérifié');
    }
    await this.userRepo.save(user);

    const payload = {
      sub: user.id,
      role: user.role,
      permissions: Permissions[user.role.name] || {},
    };
    const token = this.jwtService.sign(payload);
    const decoded: any = this.jwtService.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;

    return {
      success: true,
      message: 'Connexion réussie',
      access_token: token,
      expiresAt,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role?.name },
    };
  }

  async requestEmailCode(dto: { email: string }) {
    // If there is a pending registration, resend a 45-minute code
    const pending = await this.pendingRepo.findOne({ where: { email: dto.email } });
    if (pending) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const hash = await bcrypt.hash(code, 10);
      pending.verificationCodeHash = hash;
      const exp = new Date();
      exp.setMinutes(exp.getMinutes() + 45);
      pending.verificationCodeExpiresAt = exp;
      await this.pendingRepo.save(pending);
      try { await this.mailer.sendVerificationCode(dto.email, code, exp); } catch {}
      return { success: true, message: 'Code de vérification envoyé' };
    }

    // Fallback: existing user flow (rare, mainly for non SIMPLE_USER)
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) return { success: true, message: 'Si un compte existe, un code a été envoyé' };
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const hash = await bcrypt.hash(code, 10);
    user.emailVerificationCodeHash = hash;
    const exp = new Date();
    exp.setMinutes(exp.getMinutes() + 15);
    user.verificationCodeExpiresAt = exp;
    await this.userRepo.save(user);
    try { await this.mailer.sendVerificationCode(dto.email, code, exp); } catch {}
    return { success: true, message: 'Code de vérification envoyé' };
  }

  async verifyEmail(dto: { email: string; code: string }) {
    // Check pending registration first
    const pending = await this.pendingRepo.findOne({ where: { email: dto.email } });
    if (pending) {
      if (!pending.verificationCodeHash || !pending.verificationCodeExpiresAt) {
        throw new BadRequestException('Code invalide');
      }
      if (new Date() > pending.verificationCodeExpiresAt) {
        // Expired -> clean up and force re-register
        await this.pendingRepo.delete(pending.id);
        throw new BadRequestException('Code expiré');
      }
      const ok = await bcrypt.compare(dto.code, pending.verificationCodeHash);
      if (!ok) throw new BadRequestException('Code invalide');

      const roleEntity = await this.ensureRole(pending.roleName as RoleName);
      const user = this.userRepo.create({
        email: pending.email,
        displayName: pending.displayName,
        password: pending.passwordHash,
        isEmailVerified: true,
        role: roleEntity,
      });
      await this.userRepo.save(user);
      await this.pendingRepo.delete(pending.id);
      try { await this.mailer.sendWelcome(user.email, user.displayName); } catch {}
      return { success: true, message: 'Email vérifié. Compte créé.', data: { email: user.email } };
    }

    // Fallback: existing user verification flow
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.emailVerificationCodeHash || !user.verificationCodeExpiresAt) {
      throw new BadRequestException('Code invalide');
    }
    if (new Date() > user.verificationCodeExpiresAt) {
      throw new BadRequestException('Code expiré');
    }
    const ok = await bcrypt.compare(dto.code, user.emailVerificationCodeHash);
    if (!ok) throw new BadRequestException('Code invalide');
    user.isEmailVerified = true;
    user.emailVerificationCodeHash = null;
    user.verificationCodeExpiresAt = null;
    await this.userRepo.save(user);
    try { await this.mailer.sendWelcome(user.email, user.displayName); } catch {}
    return { success: true, message: 'Email vérifié' };
  }

  async forgotPassword(dto: { email: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) return { success: true, message: 'Si un compte existe, un email a été envoyé' };
    const tokenId = randomUUID();
    const token = randomUUID();
    const hash = await bcrypt.hash(token, 10);
    const exp = new Date();
    exp.setHours(exp.getHours() + 1);
    user.resetPasswordTokenId = tokenId;
    user.resetPasswordTokenHash = hash;
    user.resetPasswordExpiresAt = exp;
    await this.userRepo.save(user);
    try {
      const base = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').replace(/\/$/, '');
      const resetUrl = `${base}/reset-password?tokenId=${encodeURIComponent(tokenId)}&token=${encodeURIComponent(token)}`;
      await this.mailer.sendPasswordReset(user.email, resetUrl);
    } catch {}
    return { success: true, message: 'Si un compte existe, un email a été envoyé' };
  }

  async resetPassword(dto: { tokenId: string; token: string; newPassword: string; confirmPassword: string }) {
    if (dto.newPassword !== dto.confirmPassword) throw new BadRequestException('Les mots de passe ne correspondent pas');
    const user = await this.userRepo.findOne({ where: { resetPasswordTokenId: dto.tokenId } });
    if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpiresAt) {
      throw new BadRequestException('Jeton invalide');
    }
    if (new Date() > user.resetPasswordExpiresAt) {
      throw new BadRequestException('Jeton expiré');
    }
    const ok = await bcrypt.compare(dto.token, user.resetPasswordTokenHash);
    if (!ok) throw new BadRequestException('Jeton invalide');
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.resetPasswordTokenId = null;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await this.userRepo.save(user);
    return { success: true, message: 'Mot de passe réinitialisé' };
  }
}