// src/users/users.service.ts
import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DeletedEmail } from './deleted-email.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from '../roles/roles.constants';
import { Permissions } from '../roles/permissions';
import { Role } from '../roles/role.entity';
import { Article } from '../articles/article.entity';
import { Comment } from '../comments/comment.entity';
import * as fs from 'fs';
import { join, dirname, basename, extname } from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(DeletedEmail) private deletedEmailRepo: Repository<DeletedEmail>,
  ) {}

  private async ensureRole(name: RoleName): Promise<Role> {
    let role = await this.roleRepo.findOne({ where: { name } });
    if (!role) {
      role = this.roleRepo.create({ name });
      role = await this.roleRepo.save(role);
    }
    return role;
  }

  private removeFileSafe(relativePath?: string | null) {
    if (!relativePath) return;
    const abs = join(process.cwd(), relativePath.replace(/^\/+/, ''));
    try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (_) {}
  }

  private cleanupCoverAndThumbs(coverUrl?: string | null) {
    if (!coverUrl) return;
    const abs = join(process.cwd(), coverUrl.replace(/^\/+/, ''));
    try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (_) {}
    try {
      const dir = dirname(abs);
      const base = basename(abs, extname(abs));
      const ext = extname(abs);
      if (fs.existsSync(dir)) {
        for (const f of fs.readdirSync(dir)) {
          if (f.startsWith(`${basename(base)}`) && f.includes('-') && f.endsWith(ext)) {
            if (/-(\d{2,4})w\.[^.]+$/i.test(f)) {
              try { fs.unlinkSync(join(dir, f)); } catch (_) {}
            }
          }
        }
      }
    } catch (_) {}
  }

  async findAll(
    requestingUser: any,
    filters: { search?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' } = {}
  ) {
    const actorRole: RoleName = requestingUser.role.name;
    const query = this.repo.createQueryBuilder('user').leftJoinAndSelect('user.role', 'role');

    // SECONDARY_ADMIN: can list users but only MEMBERS and SIMPLE_USERS
    if (actorRole === RoleName.SECONDARY_ADMIN) {
      query.andWhere('role.name IN (:...roles)', { roles: [RoleName.MEMBER, RoleName.SIMPLE_USER] });
    } else if (
      !Permissions[actorRole]?.canPromoteMembers &&
      !Permissions[actorRole]?.canDeleteAdmins
    ) {
      // Everyone else without elevated user management permissions cannot list users
      throw new ForbiddenException('Vous n\'avez pas accès à la liste des utilisateurs');
    }

    if (filters.search) {
      query.andWhere('user.email ILIKE :search OR user.displayName ILIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.sort) {
      query.orderBy(`user.${filters.sort}`, filters.order ?? 'DESC');
    } else {
      query.orderBy('user.createdAt', 'DESC');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return {
      success: true,
      message: 'Liste des utilisateurs récupérée',
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async create(email: string, displayName: string, password: string, confirmPassword: string, requestingUser: any) {
    if (!Permissions[requestingUser.role.name]?.canPromoteMembers) {
      throw new ForbiddenException('Vous n\'avez pas le droit de créer un utilisateur');
    }
    if (!email || !displayName) {
      throw new BadRequestException('email et displayName sont requis');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
    }
    if (password !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }
    // Prevent duplicate emails (would otherwise throw a DB error)
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }
    // Default role for admin-created accounts: MEMBER
    const roleEntity = await this.ensureRole(RoleName.MEMBER);
    // Hash provided password
    const hashed = await bcrypt.hash(password, 10);

    const user = this.repo.create({ email, displayName, password: hashed, role: roleEntity });
    await this.repo.save(user);
    const { password: _, ...safe } = user as any;
    return { success: true, message: 'Utilisateur créé avec succès', data: safe };
  }

  async updateAvatar(userId: string, file: Express.Multer.File, requestingUser: any) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const isAdmin = [RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN].includes(requestingUser.role.name);
    const isSelf = requestingUser.userId === userId;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Vous ne pouvez pas modifier l\'avatar de cet utilisateur');
    }

    // Store relative path to avoid hardcoding host
    const relativeUrl = `/uploads/avatars/${file.filename}`;
    user.avatarUrl = relativeUrl;
    await this.repo.save(user);

    return { success: true, message: 'Avatar mis à jour', data: { id: user.id, avatarUrl: user.avatarUrl } };
  }

  async purgeRegisteredMembers(requestingUser: any) {
    // Seul le PRIMARY_ADMIN peut purger
    if (requestingUser.role?.name !== RoleName.PRIMARY_ADMIN) {
      throw new ForbiddenException('Action réservée au PRIMARY_ADMIN');
    }

    // Récupérer tous les utilisateurs MEMBER
    const members = await this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :roleName', { roleName: RoleName.MEMBER })
      .getMany();

    if (members.length === 0) {
      return { success: true, message: 'Aucun utilisateur MEMBER à supprimer', deleted: 0 };
    }

    await this.repo.remove(members);
    return { success: true, message: 'Utilisateurs MEMBER supprimés', deleted: members.length };
  }

  async changeRole(targetUserId: string, newRoleName: RoleName.SECONDARY_ADMIN | RoleName.MEMBER, requestingUser: any) {
    // Seul le PRIMARY_ADMIN peut changer les rôles
    if (requestingUser.role?.name !== RoleName.PRIMARY_ADMIN) {
      throw new ForbiddenException('Seul le PRIMARY_ADMIN peut changer les rôles');
    }

    const user = await this.repo.findOne({ where: { id: targetUserId }, relations: ['role'] });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Ne jamais modifier un PRIMARY_ADMIN
    if (user.role?.name === RoleName.PRIMARY_ADMIN) {
      throw new ForbiddenException('Le rôle du PRIMARY_ADMIN ne peut pas être modifié');
    }

    // Enforce: promotion to SECONDARY_ADMIN is only allowed from MEMBER
    if (newRoleName === RoleName.SECONDARY_ADMIN && user.role?.name !== RoleName.MEMBER) {
      throw new ForbiddenException('Seul un MEMBER peut être promu en SECONDARY_ADMIN');
    }

    const roleEntity = await this.ensureRole(newRoleName);
    user.role = roleEntity;
    await this.repo.save(user);
    return { success: true, message: 'Rôle mis à jour', data: { id: user.id, role: user.role.name } };
  }

  async deleteUser(targetUserId: string, requestingUser: any) {
    const actorRole: RoleName = requestingUser.role?.name;
    const target = await this.repo.findOne({ where: { id: targetUserId }, relations: ['role'] });
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    // Pré-suppression: nettoyage des contenus associés (articles, brouillons, commentaires, fichiers)
    const cleanupUserContent = async () => {
      // Supprimer l'avatar si présent
      this.removeFileSafe(target.avatarUrl);

      // Récupérer les articles (publiés et brouillons)
      const articles = await this.articleRepo.find({ where: { authorId: targetUserId } });
      for (const a of articles) {
        this.cleanupCoverAndThumbs(a.coverUrl);
      }
      // Supprimer les articles (les commentaires & stats liés seront supprimés via CASCADE)
      await this.articleRepo.createQueryBuilder().delete().from(Article).where('authorId = :uid', { uid: targetUserId }).execute();

      // Supprimer les commentaires écrits par l'utilisateur sur les articles d'autrui
      await this.commentRepo.createQueryBuilder().delete().from(Comment).where('authorId = :uid', { uid: targetUserId }).execute();
    };

    if (actorRole === RoleName.PRIMARY_ADMIN) {
      if (requestingUser.userId === targetUserId) {
        throw new ForbiddenException('Vous ne pouvez pas vous supprimer vous-même');
      }
      await cleanupUserContent();
      
      // Sauvegarder l'email dans la table des emails supprimés
      const deletedEmail = this.deletedEmailRepo.create({
        email: target.email,
        originalUserId: targetUserId
      });
      await this.deletedEmailRepo.save(deletedEmail);
      
      await this.repo.delete(targetUserId);
      return { success: true, message: 'Utilisateur supprimé' };
    }

    if (actorRole === RoleName.SECONDARY_ADMIN) {
      const targetRole: RoleName = target.role?.name as RoleName;
      const canDelete = targetUserId === requestingUser.userId || [RoleName.MEMBER, RoleName.SIMPLE_USER].includes(targetRole);
      if (!canDelete) {
        throw new ForbiddenException('Vous ne pouvez pas supprimer cet utilisateur');
      }
      await cleanupUserContent();
      await this.repo.delete(targetUserId);
      return { success: true, message: 'Utilisateur supprimé' };
    }

    if (actorRole === RoleName.MEMBER) {
      if (targetUserId !== requestingUser.userId) {
        throw new ForbiddenException('Vous ne pouvez supprimer que votre propre compte');
      }
      await cleanupUserContent();
      await this.repo.delete(targetUserId);
      return { success: true, message: 'Compte supprimé' };
    }

    throw new ForbiddenException('Action non autorisée');
  }
  // ...existing code...
}