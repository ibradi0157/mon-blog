// src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../roles/roles.constants.js';

export const Roles = (...roles: RoleName[]) => SetMetadata('roles', roles);
