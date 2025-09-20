import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Footer } from './footer.entity';
import { FooterService } from './footer.service';
import { FooterController } from './footer.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Footer]),
    CacheModule.register(),
    ConfigModule,
  ],
  controllers: [FooterController],
  providers: [FooterService],
  exports: [FooterService],
})
export class FooterModule {}
