import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateGenreDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;
}
