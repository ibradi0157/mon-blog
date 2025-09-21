// src/auth/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../roles/roles.constants.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<RoleName[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no authenticated user or missing role info, deny access gracefully (Nest will return 403)
    if (!user || !user.role || !user.role.name) {
      return false;
    }

    return requiredRoles.includes(user.role.name);
  }
}
