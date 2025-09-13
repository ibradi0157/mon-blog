// src/health/health.controller.ts
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DbHealthService } from './db-health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly dbHealth: DbHealthService) {}

  @Get('db')
  async db() {
    const res = await this.dbHealth.check();
    if (res.status === 'ok') return res;
    throw new HttpException(res, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
