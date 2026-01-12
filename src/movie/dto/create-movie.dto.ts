import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
    example: '겨울왕국',
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 설명',
    example: '3시간 동안 겨울왕국 보기',
  })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '감독 객체 ID',
    example: 1,
  })
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true }) // each: true :  validation 옵션, 배열 모든 요소가 number 타입이어야 한다.
  @ApiProperty({
    description: '작품 장르 IDs',
    example: [1, 2, 3],
  })
  genreIds: number[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 파일 이름',
    example: 'aaa-bbb-ccc-ddd.mp4',
  })
  movieFileName: string;
}
