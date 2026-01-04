import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDate() // enableImplicitConversion: true 옵션 덕분에 알아서 date 타입으로 변환이 된다음 @IsDate()로 체크해도 에러 발생하지 않는다. .
  dob: Date; // 여기서 지정한 타입으로 변환된 후 데코레이터에서 유효성 검사한다.

  @IsNotEmpty()
  @IsString()
  nationality: string;
}
