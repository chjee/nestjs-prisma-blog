import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category Name',
    example: 'Backend',
    minLength: 2,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 60)
  readonly name!: string;
}
