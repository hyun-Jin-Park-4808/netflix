import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  // id_52, likeCount_20
  // 52
  @ApiProperty({
    description: 'pagination cursor',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjF9LCJvcmRlciI6WyJpZF9ERVNDIl19',
  })
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsOptional()
  // id_ASC, id_DESC
  @ApiProperty({
    description: '내림차 또는 오름차 정렬',
    example: ['id_DESC'],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value])) // swagger에서 값 하나 들어오면 배열로 반환안해주기 때문에 Transform 적용
  order: string[] = ['id_DESC']; // 쿼리에 넣어줄 때는 키 값을 ?order[]=likeCount_DESC&order[]=id_DESC 와 같이 전달해야한다.

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터 갯수',
    example: 2,
  })
  take: number = 2;
}
