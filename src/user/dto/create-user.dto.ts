import { $Enums } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(4, 60)
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 60)
  readonly password: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(6, 60)
  readonly email: string;

  @IsString()
  @IsEnum(['ADMIN', 'USER'])
  readonly role: $Enums.Role;
}
