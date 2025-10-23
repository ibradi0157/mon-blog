import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

class SubscribeDto {
  email: string;
}

class UnsubscribeDto {
  email: string;
  token: string;
}

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.service.subscribe(dto.email);
  }

  @Post('unsubscribe')
  unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.service.unsubscribe(dto.email, dto.token);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  getCount() {
    return this.service.getCount();
  }
}
