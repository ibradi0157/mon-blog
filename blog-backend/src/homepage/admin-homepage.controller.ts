import { Body, Controller, Get, Patch, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import type { UpdateHomepagePayload } from './homepage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';

@Controller('admin/homepage')
export class AdminHomepageController {
  constructor(private readonly service: HomepageService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  getConfig() {
    return this.service.getAdminConfig();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  update(@Body() body: UpdateHomepagePayload) {
    return this.service.updateConfig(body);
  }
}
