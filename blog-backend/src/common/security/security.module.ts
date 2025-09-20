import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityService } from './security.service';
import { AdvancedSecurityService } from './advanced-security.service';
import { ContentSecurityService } from './content-security.service';
import { SessionMiddleware } from './session.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CsrfInterceptor } from './csrf.interceptor';
import { CsrfController } from './csrf.controller';

@Global()
@Module({
  controllers: [CsrfController],
  providers: [
    SecurityService,
    AdvancedSecurityService,
    ContentSecurityService,
    SessionMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: CsrfInterceptor,
    }
  ],
  exports: [
    SecurityService,
    AdvancedSecurityService,
    ContentSecurityService
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionMiddleware)
      .forRoutes('*');
  }
}
