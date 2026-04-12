import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post Title',
    example: 'Just 10 minutes.',
    minLength: 2,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 60)
  readonly title!: string;

  @ApiProperty({
    description: 'Post Content',
    example: 'A short body for the blog post.',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly content?: string;

  @ApiProperty({
    description: 'published or not',
    example: false,
  })
  @IsBoolean()
  readonly published!: boolean;

  @ApiProperty({
    description: 'Category IDs to connect',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  readonly categoryIds?: number[];
}
