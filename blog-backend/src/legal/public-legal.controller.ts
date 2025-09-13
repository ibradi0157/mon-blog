import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LegalService, LegalSlug } from './legal.service.js';

@ApiTags('legal')
@Controller('legal')
export class PublicLegalController {
  constructor(private readonly service: LegalService) {}

  @Get()
  list() {
    return this.service.getPublicAll();
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    const normalized = slug as LegalSlug;
    if (normalized !== 'privacy' && normalized !== 'terms') {
      // This will throw NotFound inside service; keep same behavior for unknown slug by mapping to not found
      // Alternatively, we could throw here, but delegating keeps error shape consistent
    }
    return this.service.getPublicBySlug(normalized);
  }
}
