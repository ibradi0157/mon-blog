import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalPage } from './legal-page.entity.js';
import { LegalService } from './legal.service.js';
import { PublicLegalController } from './public-legal.controller.js';
import { AdminLegalController } from './admin-legal.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([LegalPage])],
  providers: [LegalService],
  controllers: [PublicLegalController, AdminLegalController],
  exports: [LegalService],
})
export class LegalModule {}
