import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreference } from './user-preferences.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPreference, User, Article]),
    CacheModule.register(),
  ],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class UserPreferencesModule {}
