import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User as UserEntity } from '../../users/user.entity';

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any | UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Backward-compatible alias
export const CurrentUser = User;