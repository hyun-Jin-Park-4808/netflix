import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  // id_52, likeCount_20
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsOptional()
  // id_ASC, id_DESC
  order: string[] = ['id_DESC']; // 쿼리에 넣어줄 때는 키 값을 ?order[]=likeCount_DESC&order[]=id_DESC 와 같이 전달해야한다.

  @IsInt()
  @IsOptional()
  take: number = 5;
}
