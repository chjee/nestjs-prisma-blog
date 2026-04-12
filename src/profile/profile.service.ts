import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: number): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException();
    }

    return profile;
  }

  async upsert(userId: number, dto: UpsertProfileDto): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { userId },
      update: { bio: dto.bio },
      create: { userId, bio: dto.bio },
    });
  }

  async remove(userId: number): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException();
    }

    return this.prisma.profile.delete({ where: { userId } });
  }
}
