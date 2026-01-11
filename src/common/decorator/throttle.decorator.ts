import { Reflector } from '@nestjs/core';

// 원하는 시간 단위당 요청 가능 횟수를 제한하는 interceptor
export const Throttle = Reflector.createDecorator<{
  count: number;
  unit: 'minute';
}>();
