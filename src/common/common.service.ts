import { BadRequestException, Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
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

  async applyCursorPaginationParamsToQb<T>( // applyCursorPaginationParamsToQb에 해당하는 제네릭 타입 받아서
    qb: SelectQueryBuilder<T>, // 쿼리 빌더에 넣어준다.
    dto: CursorPaginationDto,
  ) {
    let { cursor, order, take } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      /**
       *  cursorObj 구조
       * {
       * values: {
       *   id: 52
       * },
       * order: ['id_DESC']
       * }
       */
      const cursorObj = JSON.parse(decodedCursor);

      order = cursorObj.order;
      const { values } = cursorObj;

      // (movice.column1, movice.column2, movice.column3) > (:value1, :value2, :value3)
      const columns = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC'))
        ? '<'
        : '>';
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');
      const whereParams = columns.map((c) => `:${c}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');
      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException('Order는 ASC, DESC만 입력 가능합니다.');
      }

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction); // qb.alias 은 쿼리 빌더에 넣어준 테이블 이름
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }
    qb.take(take);
    const results = await qb.getMany();
    const nextCursor = this.generateNextCursor(results, order);

    return { qb, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) {
      return null;
    }

    /**
     * 아래 구조로 cursorObj 만들기
     * {
     * values: {
     *   id: 52
     * },
     * order: ['id_DESC']
     * }
     */
    const lastItem = results[results.length - 1];
    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );
    return nextCursor; // 인코딩한 값을 반환해준다.
  }
}
