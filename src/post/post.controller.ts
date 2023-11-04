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
import { PostService } from './post.service';
import { Post as PostModel } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto): Promise<PostModel> {
    return this.postService.create(createPostDto);
  }

  @Get()
  async findAll(
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ): Promise<PostModel[]> {
    return this.postService.findAll({
      skip: skip,
      take: take,
      // where: { published: true },
      // orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postService.findOne({ id: id });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostModel> {
    return this.postService.update({ where: { id: id }, data: updatePostDto });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.postService.remove({ id: id });
  }
}
