import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T>( // applyPagePaginationParamsToQb에 해당하는 제네릭 타입 받아서
    qb: SelectQueryBuilder<T>, // 쿼리 빌더에 넣어준다.
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;
    if (take && page) {
      const skip = (page - 1) * take;
      qb.take(take);
      qb.skip(skip);
    }
  }
}
