import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Post as PostModel, Role } from '@prisma/client';
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
import { User } from '../common/decorators/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@Controller('post')
@ApiTags('Post API')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiBearerAuth('access_token')
  @Post()
  @ApiOperation({
    summary: 'Post Create',
    description: 'create a post with title, published, userId.',
  })
  @ApiBody({ type: CreatePostDto })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
          title: 'Just 10 minutes.',
          content: 'A short body for the blog post.',
          published: false,
          userId: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@Body() createPostDto: CreatePostDto): Promise<PostModel> {
    return this.postService.create(createPostDto);
  }

  @ApiBearerAuth('access_token')
  @Get()
  @ApiOperation({
    summary: 'Post List',
    description: 'get post list with pagination.',
  })
  @ApiQuery({ name: 'skip', type: Number, description: 'Skip', example: 0 })
  @ApiQuery({ name: 'take', type: Number, description: 'Take', example: 10 })
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: 6,
            createdAt: new Date(),
            updatedAt: new Date(),
            title: 'Just 10 minutes.',
            content: 'A short body for the blog post.',
            published: false,
            userId: 1,
            user: {
              name: 'Ariadne',
              email: 'ariadne@prisma.io',
              role: 'USER',
            },
            categories: [
              {
                name: 'Office',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ): Promise<PostModel[]> {
    return this.postService.findAll({
      skip,
      take,
    });
  }

  @ApiBearerAuth('access_token')
  @Get(':id')
  @ApiOperation({
    summary: 'Post Detail',
    description: 'get post detail with id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Post Id', example: 1 })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
          title: 'Just 10 minutes.',
          content: 'A short body for the blog post.',
          published: false,
          userId: 1,
          user: {
            name: 'Ariadne',
            email: 'ariadne@prisma.io',
            role: 'USER',
          },
          categories: [
            {
              name: 'Office',
            },
          ],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postService.findOne({ id });
  }

  @ApiBearerAuth('access_token')
  @Patch(':id')
  @ApiOperation({
    summary: 'Post Update',
    description: 'update post with id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Post Id', example: 1 })
  @ApiBody({
    schema: {
      example: {
        title: 'Just 10 minutes.',
        content: 'A short body for the blog post.',
        published: false,
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
          title: 'Just 10 minutes.',
          content: 'A short body for the blog post.',
          published: false,
          userId: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @User('sub') requesterId: number,
    @User('role') requesterRole: Role,
  ): Promise<PostModel> {
    await this.postService.assertOwnerOrAdmin(id, requesterId, requesterRole);

    return this.postService.update({ where: { id }, data: updatePostDto });
  }

  @ApiBearerAuth('access_token')
  @Delete(':id')
  @ApiOperation({
    summary: 'Post Delete',
    description: 'delete post with id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Post Id', example: 1 })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
          title: 'Just 10 minutes.',
          content: 'A short body for the blog post.',
          published: false,
          userId: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User('sub') requesterId: number,
    @User('role') requesterRole: Role,
  ): Promise<PostModel> {
    await this.postService.assertOwnerOrAdmin(id, requesterId, requesterRole);

    return this.postService.remove({ id });
  }
}
