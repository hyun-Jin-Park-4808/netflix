import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  // value, return 타입: string, string
  transform(value: string, _metaData: ArgumentMetadata): string {
    if (!value) {
      return value;
    }
    if (value.length < 3) {
      throw new BadRequestException('제목은 3글자 이상이어야 합니다.');
    }
    return value;
  }
}
/**
 * metaData에는 세 개의 인자가 들어간다.
 * 1. type: 검증할 인자가 body, query, param, custom parameter 인지 지정해준다.
 * 2. metatype: 검증할 인자가 어떤 타입으로 선언되는지(return 타입이 무엇인지) 지정해준다.
 * 3. data: 검증 및 변환할 데이터 이름 -> @Param('id', ParseIntPipe) id: number => 'id' 부분
 */
