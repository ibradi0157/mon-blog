// src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  // Do not throw when missing/invalid token; just return user (or null)
  handleRequest(err: any, user: any) {
    return user ?? null;
  }
}
