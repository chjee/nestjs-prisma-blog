import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { Profile } from '../generated/prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@ApiTags('Profile API')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':userId')
  @ApiOperation({
    summary: 'Profile Detail',
    description: 'get profile by userId.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
    example: 1,
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: { id: 1, bio: 'Software engineer who loves Prisma.', userId: 1 },
      },
    },
  })
  async findOne(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Profile> {
    return this.profileService.findOne(userId);
  }

  @Put(':userId')
  @ApiOperation({
    summary: 'Profile Upsert',
    description: 'create or update profile for userId.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
    example: 1,
  })
  @ApiBody({ type: UpsertProfileDto })
  @ApiOkResponse({
    schema: {
      example: {
        data: { id: 1, bio: 'Software engineer who loves Prisma.', userId: 1 },
      },
    },
  })
  async upsert(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpsertProfileDto,
  ): Promise<Profile> {
    return this.profileService.upsert(userId, dto);
  }

  @Delete(':userId')
  @ApiOperation({
    summary: 'Profile Delete',
    description: 'delete profile for userId.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
    example: 1,
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: { id: 1, bio: 'Software engineer who loves Prisma.', userId: 1 },
      },
    },
  })
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Profile> {
    return this.profileService.remove(userId);
  }
}
