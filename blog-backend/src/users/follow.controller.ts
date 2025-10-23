import { Controller, Post, Delete, Get, Param, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserFollow } from './user-follow.entity';
import { User } from './user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('users/follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(
    @InjectRepository(UserFollow)
    private followRepo: Repository<UserFollow>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  @Post(':id')
  async followUser(@Param('id') targetUserId: string, @Req() req: any) {
    const currentUserId = req.user.userId;

    if (currentUserId === targetUserId) {
      throw new HttpException('Vous ne pouvez pas vous suivre vous-même', HttpStatus.BAD_REQUEST);
    }

    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new HttpException('Utilisateur introuvable', HttpStatus.NOT_FOUND);
    }

    const existing = await this.followRepo.findOne({
      where: {
        follower: { id: currentUserId },
        following: { id: targetUserId },
      },
    });

    if (existing) {
      throw new HttpException('Vous suivez déjà cet utilisateur', HttpStatus.CONFLICT);
    }

    const follow = this.followRepo.create({
      follower: { id: currentUserId } as User,
      following: { id: targetUserId } as User,
    });

    await this.followRepo.save(follow);

    // Notification
    try {
      const currentUser = await this.userRepo.findOne({ where: { id: currentUserId } });
      await this.notificationsService.create({
        userId: targetUserId,
        type: 'NEW_FOLLOWER',
        title: 'Nouveau follower',
        message: `${currentUser?.displayName || 'Un utilisateur'} vous suit maintenant`,
        link: `/auteurs/${currentUserId}`,
      });
    } catch (error) {
      console.error('Erreur création notification follow:', error);
    }

    return { success: true, message: 'Vous suivez maintenant cet auteur' };
  }

  @Delete(':id')
  async unfollowUser(@Param('id') targetUserId: string, @Req() req: any) {
    const currentUserId = req.user.userId;

    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: currentUserId },
        following: { id: targetUserId },
      },
    });

    if (!follow) {
      throw new HttpException('Vous ne suivez pas cet utilisateur', HttpStatus.NOT_FOUND);
    }

    await this.followRepo.remove(follow);

    return { success: true, message: 'Vous ne suivez plus cet auteur' };
  }

  @Get('following')
  async getFollowing(@Req() req: any) {
    const userId = req.user.userId;

    const follows = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => ({
      id: f.following.id,
      displayName: f.following.displayName,
      email: f.following.email,
      avatarUrl: f.following.avatarUrl,
      bio: f.following.bio,
      followedAt: f.createdAt,
    }));
  }

  @Get('followers/:id')
  async getFollowers(@Param('id') userId: string) {
    const follows = await this.followRepo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => ({
      id: f.follower.id,
      displayName: f.follower.displayName,
      email: f.follower.email,
      avatarUrl: f.follower.avatarUrl,
      bio: f.follower.bio,
      followedAt: f.createdAt,
    }));
  }

  @Get('status/:id')
  async getFollowStatus(@Param('id') targetUserId: string, @Req() req: any) {
    const currentUserId = req.user.userId;

    const isFollowing = await this.followRepo.findOne({
      where: {
        follower: { id: currentUserId },
        following: { id: targetUserId },
      },
    });

    const followersCount = await this.followRepo.count({
      where: { following: { id: targetUserId } },
    });

    const followingCount = await this.followRepo.count({
      where: { follower: { id: targetUserId } },
    });

    return {
      isFollowing: !!isFollowing,
      followersCount,
      followingCount,
    };
  }
}
