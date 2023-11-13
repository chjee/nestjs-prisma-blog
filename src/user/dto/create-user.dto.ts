import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User Name',
    example: 'Andrew',
    minLength: 4,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 60)
  readonly name: string;

  @ApiProperty({
    description: 'User Password',
    example: 'whoami',
    minLength: 6,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 60)
  readonly password: string;

  @ApiProperty({
    description: 'User Email',
    example: 'andrew@prisma.io',
    minLength: 6,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 60)
  readonly email: string;

  @ApiProperty({
    description: 'User Role',
    example: 'USER',
    enum: ['ADMIN', 'USER'],
  })
  @IsString()
  @IsEnum(['ADMIN', 'USER'])
  readonly role: $Enums.Role;
}
