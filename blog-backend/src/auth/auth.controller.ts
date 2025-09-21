// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestEmailCodeDto } from './dto/request-email-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { RoleName } from '../roles/roles.constants';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { MailerService } from '../mail/mailer.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mailer: MailerService,
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  private async ensureRole(name: RoleName): Promise<Role> {
    let role = await this.roleRepo.findOne({ where: { name } });
    if (!role) {
      role = this.roleRepo.create({ name });
      role = await this.roleRepo.save(role);
    }
    return role;
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    // If no users exist yet, create a PRIMARY_ADMIN immediately (verified)
    const usersCount = await this.userRepo.count();
    if (usersCount === 0) {
      const roleAdmin = await this.ensureRole(RoleName.PRIMARY_ADMIN);
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const admin = this.userRepo.create({
        email: dto.email,
        displayName: dto.displayName,
        password: hashedPassword,
        isEmailVerified: true,
        role: roleAdmin,
      });
      await this.userRepo.save(admin);
      return { success: true, message: 'Inscription réussie.', data: { email: admin.email, role: admin.role.name } };
    }

    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      // If existing and verified -> block
      if (existing.isEmailVerified) {
        throw new BadRequestException('Cet email est déjà utilisé');
      }
      // If existing but unverified and expired -> remove and continue
      if (existing.verificationCodeExpiresAt && new Date() > existing.verificationCodeExpiresAt) {
        await this.userRepo.delete(existing.id);
      } else {
        // Re-send a new code and extend expiration
        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        existing.emailVerificationCodeHash = await bcrypt.hash(code, 10);
        const exp = new Date();
        exp.setHours(exp.getHours() + 1);
        existing.verificationCodeExpiresAt = exp;
        await this.userRepo.save(existing);
        try { await this.mailer.sendVerificationCode(existing.email, code, exp); } catch {}
        return { success: true, message: 'Inscription déjà initiée. Nouveau code envoyé.', data: { email: existing.email, expiresAt: exp.toISOString() } };
      }
    }

    const role = await this.ensureRole(RoleName.SIMPLE_USER);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const exp = new Date();
    exp.setHours(exp.getHours() + 1);

    const user = this.userRepo.create({
      email: dto.email,
      displayName: dto.displayName,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationCodeHash: codeHash,
      verificationCodeExpiresAt: exp,
      role,
    });
    await this.userRepo.save(user);

    try { await this.mailer.sendVerificationCode(user.email, code, exp); } catch {}
    return { success: true, message: 'Inscription initiée. Vérifiez votre email pour le code.', data: { email: user.email, expiresAt: exp.toISOString() } };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Request() req) {
    // In production, if RECAPTCHA_SECRET_KEY is set, verify Google reCAPTCHA v2 token
    const isProd = process.env.NODE_ENV === 'production';
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (isProd && secret) {
      if (!dto.recaptchaToken) {
        throw new BadRequestException('Captcha requis');
      }
      try {
        const params = new URLSearchParams();
        params.append('secret', secret);
        params.append('response', dto.recaptchaToken);
        const ip = (req?.ip || req?.connection?.remoteAddress || '').toString();
        if (ip) params.append('remoteip', ip);
        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const data = await resp.json();
        if (!data?.success) {
          throw new BadRequestException('Captcha invalide');
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException('Erreur de vérification du Captcha');
      }
    }
    return this.authService.login(dto);
  }

  @Post('request-email-code')
  requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.authService.requestEmailCode(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
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

    const base = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').replace(/\/$/, '');
    const resetUrl = `${base}/reset-password?tokenId=${encodeURIComponent(tokenId)}&token=${encodeURIComponent(token)}`;
    try { await this.mailer.sendPasswordReset(user.email, resetUrl); } catch {}
    return { success: true, message: 'Si un compte existe, un email a été envoyé' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('check-email')
  async checkEmailAvailability(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email requis');
    }
    const existing = await this.userRepo.findOneBy({ email: body.email });
    if (existing) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }
    return { available: true, message: 'Email disponible' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    return { success: true, data: { userId, role } };
  }
}
