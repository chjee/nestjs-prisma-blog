import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertProfileDto {
  @ApiProperty({
    description: 'User bio',
    example: 'Software engineer who loves Prisma.',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  readonly bio!: string;
}
