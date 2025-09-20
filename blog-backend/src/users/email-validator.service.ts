import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DeletedEmail } from './deleted-email.entity';

@Injectable()
export class EmailValidatorService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(DeletedEmail) private deletedEmailRepo: Repository<DeletedEmail>,
  ) {}

  async isEmailPreviouslyUsed(email: string): Promise<boolean> {
    // Vérifier dans la table des utilisateurs actifs
    const existingUser = await this.repo.findOne({ where: { email } });
    if (existingUser) return true;

    // Vérifier dans la table des emails supprimés
    const deletedEmail = await this.deletedEmailRepo.findOne({ where: { email } });
    return !!deletedEmail;
  }

  async validateNewEmail(email: string): Promise<{ isValid: boolean; message?: string }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Format d\'email invalide' };
    }

    if (email.length > 254) {
      return { isValid: false, message: 'L\'email ne peut pas dépasser 254 caractères' };
    }

    const wasUsed = await this.isEmailPreviouslyUsed(email);
    if (wasUsed) {
      return { isValid: false, message: 'Cet email a déjà été utilisé et ne peut pas être réutilisé' };
    }

    return { isValid: true };
  }
}