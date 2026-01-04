import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

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

  applyCursorPaginationParamsToQb<T>( // applyCursorPaginationParamsToQb에 해당하는 제네릭 타입 받아서
    qb: SelectQueryBuilder<T>, // 쿼리 빌더에 넣어준다.
    dto: CursorPaginationDto,
  ) {
    const { id, order, take } = dto;
    if (id) {
      const dircetion = order === 'ASC' ? '>' : '<';

      // order -> ASC: movie.id > id, DESC: movie.id < id
      qb.where(`${qb.alias}.id ${dircetion} :id`, { id });
    }

    qb.orderBy(`${qb.alias}.id`, order);
    qb.take(take);
  }
}
