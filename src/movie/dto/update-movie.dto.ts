import { IsNotEmpty, IsOptional } from 'class-validator';
import { Genre } from 'src/genre/entities/genre.entity';

export class UpdateMovieDto {
  @IsNotEmpty() // title key 값을 입력하면 value 값이 비면 안 된다.
  @IsOptional() // title을 Key 값으로 안 넣는 건 허용된다.
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genres?: Genre[];

  @IsNotEmpty()
  @IsOptional()
  detail?: string;

  @IsNotEmpty()
  @IsOptional()
  directorId?: number;
}
