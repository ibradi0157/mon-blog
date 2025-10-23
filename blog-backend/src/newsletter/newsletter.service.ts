import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from './newsletter.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private newsletterRepo: Repository<NewsletterSubscriber>,
  ) {}

  async subscribe(email: string) {
    const normalized = email.trim().toLowerCase();
    
    // Check if already subscribed
    const existing = await this.newsletterRepo.findOne({ where: { email: normalized } });
    
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Cette adresse email est déjà inscrite');
      }
      // Reactivate if was unsubscribed
      existing.isActive = true;
      existing.unsubscribedAt = null;
      await this.newsletterRepo.save(existing);
      return { success: true, message: 'Inscription réactivée avec succès' };
    }

    // Create new subscription
    const token = randomBytes(32).toString('hex');
    const subscriber = this.newsletterRepo.create({
      email: normalized,
      isActive: true,
      unsubscribeToken: token,
    });
    
    await this.newsletterRepo.save(subscriber);
    
    // TODO: Send welcome email with unsubscribe link
    
    return { success: true, message: 'Inscription réussie' };
  }

  async unsubscribe(email: string, token: string) {
    const normalized = email.trim().toLowerCase();
    const subscriber = await this.newsletterRepo.findOne({
      where: { email: normalized, unsubscribeToken: token },
    });

    if (!subscriber) {
      throw new ConflictException('Lien de désinscription invalide');
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await this.newsletterRepo.save(subscriber);

    return { success: true, message: 'Désinscription réussie' };
  }

  async getActiveSubscribers() {
    return this.newsletterRepo.find({
      where: { isActive: true },
      select: ['email'],
    });
  }

  async getCount() {
    const active = await this.newsletterRepo.count({ where: { isActive: true } });
    const total = await this.newsletterRepo.count();
    return { active, total };
  }
}
