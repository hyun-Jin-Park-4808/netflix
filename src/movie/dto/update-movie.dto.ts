
import { PartialType } from '@nestjs/swagger'; // swagger에서 불러와야 CreateMovieDto swagger 정보를 참조하게 해준다. 
import { CreateMovieDto } from './create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}

// export class UpdateMovieDto {
//   @IsNotEmpty() // title key 값을 입력하면 value 값이 비면 안 된다.
//   @IsOptional() // title을 Key 값으로 안 넣는 건 허용된다.
//   @IsString()
//   title?: string;

//   @IsArray()
//   @ArrayNotEmpty()
//   @IsNumber({}, { each: true }) // each: true :  validation 옵션, 배열 모든 요소가 number 타입이어야 한다.
//   genreIds?: number[];

//   @IsNotEmpty()
//   @IsString()
//   @IsOptional()
//   detail?: string;

//   @IsNotEmpty()
//   @IsOptional()
//   @IsNumber()
//   directorId?: number;
// }
