import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
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
  readonly title: string;

  @ApiProperty({
    description: 'published or not',
    example: false,
  })
  @IsBoolean()
  readonly published: boolean;

  @ApiProperty({
    description: 'Post User Id',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  readonly userId: number;

  readonly user: {
    connect: {
      id: number;
    };
  };
}
