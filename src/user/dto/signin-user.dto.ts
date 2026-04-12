import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SignInUserDto {
  @ApiProperty({
    description: 'User Email',
    example: 'alice@prisma.io',
    minLength: 6,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 60)
  readonly email!: string;

  @ApiProperty({
    description: 'User Password',
    example: 'whoami',
    minLength: 6,
    maxLength: 60,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 60)
  readonly password!: string;
}
