import { $Enums } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Min(0)
  readonly name: string;

  @IsNotEmpty()
  @IsEmail()
  @MinLength(6)
  readonly email: string;

  @IsString()
  @IsEnum(['ADMIN', 'USER'])
  readonly role: $Enums.Role;
}
