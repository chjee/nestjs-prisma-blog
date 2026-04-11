import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PickType(PartialType(CreatePostDto), [
  'title',
  'content',
  'published',
  'categoryIds',
] as const) {}
