import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 60)
  readonly title: string;

  @IsBoolean()
  readonly published: boolean;

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
