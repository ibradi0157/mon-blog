import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CaptchaService } from './captcha.service';

export class ValidateCaptchaDto {
  challengeId: string;
  answer: number;
}

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('challenge')
  async generateChallenge() {
    try {
      const challenge = await this.captchaService.generateChallenge();
      return {
        success: true,
        data: challenge,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate CAPTCHA challenge',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate')
  async validateChallenge(@Body() dto: ValidateCaptchaDto) {
    try {
      const { challengeId, answer } = dto;
      
      if (!challengeId || answer === undefined || answer === null) {
        throw new HttpException(
          'Challenge ID and answer are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isValid = await this.captchaService.validateChallenge(
        challengeId,
        Number(answer),
      );

      return {
        success: true,
        data: { isValid },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to validate CAPTCHA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('refresh/:challengeId')
  async refreshChallenge(@Param('challengeId') challengeId: string) {
    try {
      const newChallenge = await this.captchaService.refreshChallenge(challengeId);
      return {
        success: true,
        data: newChallenge,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to refresh CAPTCHA challenge',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getChallengeStats() {
    try {
      const stats = await this.captchaService.getChallengeStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch CAPTCHA stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
