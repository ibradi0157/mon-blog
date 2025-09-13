// src/users/dto/change-role.dto.ts
import { IsEnum } from 'class-validator';
import { RoleName } from '../../roles/roles.constants';

export class ChangeRoleDto {
  @IsEnum(RoleName, {
    message: 'role doit être SECONDARY_ADMIN ou MEMBER',
  })
  role: RoleName.SECONDARY_ADMIN | RoleName.MEMBER;
}
