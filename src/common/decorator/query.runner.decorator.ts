import {
  createParamDecorator,
  InternalServerErrorException,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data: unknown, context: any) => {
    const request = context.switchToHttp().getRequest();
    if (!request || !request.queryRunner) {
      // @UseInterceptors(TransactionInterceptor)를 적용하지 않은 경우만 queryRunner가 없기 때문에 서버쪽 실수다.
      throw new InternalServerErrorException(
        'QueryRunner 객체를 찾을 수 없습니다.',
      );
    }
    return request.queryRunner;
  },
);
