import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SignInUserDto {
  @ApiProperty({
    description: 'User Email',
    example: 'alice@prisma.io',
    minLength: 5,
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 60)
  readonly email!: string;

  @ApiProperty({
    description: 'User Password',
    example: 'whoami',
    minLength: 5,
    maxLength: 12,
  })
  @IsNotEmpty()
  @IsString()
  @Length(5, 12)
  readonly password!: string;
}
