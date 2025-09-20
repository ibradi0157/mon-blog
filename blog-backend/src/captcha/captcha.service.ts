import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

export interface CaptchaChallenge {
  id: string;
  question: string;
  answer: number;
  expiresAt: Date;
}

export interface CaptchaResponse {
  challengeId: string;
  question: string;
  imageData?: string;
}

@Injectable()
export class CaptchaService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private generateMathQuestion(): { question: string; answer: number } {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number, question: string;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      default:
        num1 = 5;
        num2 = 3;
        answer = 8;
        question = '5 + 3';
    }
    
    return { question, answer };
  }

  private generateTextQuestion(): { question: string; answer: number } {
    const questions = [
      { question: "Combien de jours dans une semaine ?", answer: 7 },
      { question: "Combien de mois dans une année ?", answer: 12 },
      { question: "Combien d'heures dans une journée ?", answer: 24 },
      { question: "Combien de minutes dans une heure ?", answer: 60 },
      { question: "Combien de pattes a un chat ?", answer: 4 },
      { question: "Combien de roues a une voiture ?", answer: 4 },
      { question: "Combien de doigts sur une main ?", answer: 5 },
      { question: "Combien font deux plus deux ?", answer: 4 },
      { question: "Combien font cinq moins trois ?", answer: 2 },
      { question: "Combien font trois fois deux ?", answer: 6 },
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }

  async generateChallenge(): Promise<CaptchaResponse> {
    const challengeId = crypto.randomUUID();
    const type = Math.random() > 0.5 ? 'math' : 'text';
    
    const challenge = type === 'math' 
      ? this.generateMathQuestion()
      : this.generateTextQuestion();
    
    const captchaData: CaptchaChallenge = {
      id: challengeId,
      question: challenge.question,
      answer: challenge.answer,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expire après 5 minutes
    };
    
    // Store in cache for 5 minutes
    await this.cacheManager.set(
      `captcha:${challengeId}`, 
      captchaData, 
      300
    );
    
    return {
      challengeId,
      question: `Veuillez résoudre: ${challenge.question} = ?`,
    };
  }

  async validateChallenge(challengeId: string, userAnswer: number): Promise<boolean> {
    try {
      const challenge = await this.cacheManager.get<CaptchaChallenge>(
        `captcha:${challengeId}`
      );
      
      if (!challenge) {
        return false; // Challenge expired or doesn't exist
      }
      
      // Check if expired
      if (new Date() > challenge.expiresAt) {
        await this.cacheManager.del(`captcha:${challengeId}`);
        return false;
      }
      
      const isValid = challenge.answer === userAnswer;
      
      // Remove challenge after validation (single use)
      await this.cacheManager.del(`captcha:${challengeId}`);
      
      return isValid;
    } catch (error) {
      return false;
    }
  }

  async generateImageCaptcha(): Promise<CaptchaResponse> {
    // For now, we'll stick with text-based CAPTCHA
    // Image CAPTCHA could be implemented later using canvas or image generation libraries
    return this.generateChallenge();
  }

  async refreshChallenge(oldChallengeId: string): Promise<CaptchaResponse> {
    // Remove old challenge
    await this.cacheManager.del(`captcha:${oldChallengeId}`);
    
    // Generate new one
    return this.generateChallenge();
  }

  async getChallengeStats(): Promise<{ totalActive: number; totalExpired: number }> {
    // This would require Redis SCAN or similar functionality to count keys
    // For now, return basic stats
    return {
      totalActive: 0,
      totalExpired: 0,
    };
  }
}
