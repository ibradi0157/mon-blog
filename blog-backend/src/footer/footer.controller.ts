import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  UseGuards, 
  Post,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { FooterService } from './footer.service';
import { UpdateFooterDto } from './dto/update-footer.dto';

@Controller('footer')
export class FooterController {
  constructor(private readonly footerService: FooterService) {}

  @Get()
  async getPublicFooter() {
    const footer = await this.footerService.getPublicFooter();
    return {
      success: true,
      data: footer
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  async getAdminFooter() {
    const footer = await this.footerService.getFooterForAdmin();
    return {
      success: true,
      data: footer
    };
  }

  @Put('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateFooter(@Body() updateData: UpdateFooterDto) {
    return await this.footerService.updateFooter(updateData);
  }

  @Post('admin/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @HttpCode(HttpStatus.OK)
  async resetFooter() {
    return await this.footerService.resetToDefault();
  }
}
