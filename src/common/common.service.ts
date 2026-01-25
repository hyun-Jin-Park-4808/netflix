/* eslint-disable prefer-const */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectCannedACL, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { SelectQueryBuilder } from 'typeorm';
import { v4 as Uuid } from 'uuid';
import { envVarableKeys } from './const/env.const';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { PagePaginationDto } from './dto/page-pagination.dto';

@Injectable()
export class CommonService {
  private s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      region: configService.get<string>(envVarableKeys.awsRegion),
      credentials: {
        accessKeyId: configService.get<string>(envVarableKeys.awsAccessKeyId),
        secretAccessKey: configService.get<string>(
          envVarableKeys.awsSecretAccessKey,
        ),
      },
    });
  }

  async saveMovieToPermanentStorage(fileName: string) {
    try {
      const bucketName = this.configService.get<string>(
        envVarableKeys.bucketName,
      );
      await this.s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/public/temp/${fileName}`, // 옮길 파일
        Key: `public/movie/${fileName}`, // 해당 Key로 옮기겠다.
        ACL: 'public-read',
      });

      // 옮긴 파일 삭제
      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: `public/temp/${fileName}`,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('S3 저장에 실패하였습니다.');
    }
  }

  async createPresignedUrl(expiresIn = 300) {
    const params = {
      Bucket: this.configService.get<string>(envVarableKeys.bucketName),
      Key: `public/temp/${Uuid()}.mp4`,
      ACL: ObjectCannedACL.public_read,
    };

    try {
      const url = await getSignedUrl(this.s3, new PutObjectCommand(params), {
        expiresIn,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'S3 Presigned URL 생성에 실패하였습니다.',
      );
    }
  }

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
