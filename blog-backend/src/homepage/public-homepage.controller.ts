import { Controller, Get } from '@nestjs/common';
import { HomepageService } from './homepage.service';

@Controller('homepage')
export class PublicHomepageController {
  constructor(private readonly service: HomepageService) {}

  @Get()
  getPublic() {
    return this.service.getPublicConfig();
  }
}
