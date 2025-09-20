import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
