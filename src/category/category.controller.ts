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
import { Category } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryService } from './category.service';

@Controller('category')
@ApiTags('Category API')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiBearerAuth('access_token')
  @Post()
  @Roles(['ADMIN'])
  @ApiOperation({
    summary: 'Category Create',
    description: 'create a category with name. ADMIN only.',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 1,
          name: 'Backend',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @ApiBearerAuth('access_token')
  @Get()
  @ApiOperation({
    summary: 'Category List',
    description: 'get category list with pagination.',
  })
  @ApiQuery({ name: 'skip', type: Number, description: 'Skip', example: 0 })
  @ApiQuery({ name: 'take', type: Number, description: 'Take', example: 20 })
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Backend',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ): Promise<Category[]> {
    return this.categoryService.findAll({ skip, take });
  }

  @ApiBearerAuth('access_token')
  @Get(':id')
  @ApiOperation({
    summary: 'Category Detail',
    description: 'get category detail with id.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
    example: 1,
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 1,
          name: 'Backend',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoryService.findOne({ id });
  }

  @ApiBearerAuth('access_token')
  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiOperation({
    summary: 'Category Update',
    description: 'update category with id. ADMIN only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
    example: 1,
  })
  @ApiBody({ schema: { example: { name: 'Data' } } })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 1,
          name: 'Data',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  @ApiBearerAuth('access_token')
  @Delete(':id')
  @Roles(['ADMIN'])
  @ApiOperation({
    summary: 'Category Delete',
    description: 'delete category with id. ADMIN only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
    example: 1,
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: {
          id: 1,
          name: 'Backend',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoryService.remove({ id });
  }
}
