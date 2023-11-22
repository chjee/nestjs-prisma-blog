import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('user')
@ApiTags('User API')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('access_token')
  @Post()
  @ApiOperation({
    summary: 'User Create',
    description: 'create a user with name, password, email, role.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 4,
          name: 'Andrew',
          email: 'andrew@prisma.io',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserModel> {
    return this.userService.create(createUserDto);
  }

  @ApiBearerAuth('access_token')
  @Get()
  @ApiOperation({
    summary: 'User List',
    description: 'get user list with pagination.',
  })
  @ApiQuery({ name: 'skip', type: Number, description: 'Skip', example: 0 })
  @ApiQuery({ name: 'take', type: Number, description: 'Take', example: 10 })
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Alice',
            email: 'alice@prisma.io',
            role: 'USER',
            profile: null,
            posts: [
              {
                id: 1,
                createdAt: '2023-11-09T08:52:11.643Z',
                updatedAt: '2023-11-09T08:52:11.643Z',
                title: 'Check out Prisma with Nest.js',
                published: true,
                userId: 1,
              },
            ],
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ): Promise<Partial<UserModel>[]> {
    return this.userService.findAll({
      skip: skip,
      take: take,
    });
  }

  @ApiBearerAuth('access_token')
  @Get(':id')
  @ApiOperation({
    summary: 'User Detail',
    description: 'get user detail with id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 1,
          name: 'Alice',
          email: 'alice@prisma.io',
          role: 'USER',
          profile: null,
          posts: [
            {
              id: 1,
              createdAt: '2023-11-09T08:52:11.643Z',
              updatedAt: '2023-11-09T08:52:11.643Z',
              title: 'Check out Prisma with Nest.js',
              published: true,
              userId: 1,
            },
          ],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<UserModel>> {
    return this.userService.findOne({ id });
  }

  @ApiBearerAuth('access_token')
  @Patch(':id')
  @ApiOperation({
    summary: 'User Update',
    description: 'update user with id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID', example: 4 })
  @ApiBody({ schema: { example: { name: 'Andrew', role: 'ADMIN' } } })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 4,
          name: 'Andrew',
          email: 'alice@prisma.io',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserModel>> {
    return this.userService.update({ where: { id: id }, data: updateUserDto });
  }

  @ApiBearerAuth('access_token')
  @Delete(':id')
  @ApiOperation({
    summary: 'User Delete',
    description: 'delete user with id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID', example: 4 })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 4,
          name: 'Andrew',
          email: 'alice@prisma.io',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.userService.remove({ id: id });
  }
}
