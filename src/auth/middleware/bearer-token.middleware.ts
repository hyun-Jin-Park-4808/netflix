import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVarableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // NestMiddleware 인터페이스를 구현하려면 use 메소드를 구현해야한다.
    // Basic $token
    // Bearer $token
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBeareToken(authHeader);
    const blockedToken = await this.cacheManager.get(`BOLOCK_TOKEN_${token}`);
    if (blockedToken) {
      throw new UnauthorizedException('차단된 토큰입니다.');
    }
    const decodedPayload = await this.jwtService.decode(token);
    const tokenKey = `TOKEN_${token}`;
    const cachedPayload = await this.cacheManager.get(tokenKey);
    if (cachedPayload) {
      req.user = cachedPayload;
      return next();
    }

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVarableKeys.refreshTokenSecret
          : envVarableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      // payload['exp'] -> epoch time seconds
      const expiryDate = +new Date(payload['exp'] * 1000); // 숫자(ms)로 변환하기 위해 +붙임.
      const now = +new Date();
      const differenceInSeconds = (expiryDate - now) / 1000; // 초 단위로 변환하기 위해 /1000 적용.
      await this.cacheManager.set(
        `TOKEN_${token}`,
        payload,
        Math.max((differenceInSeconds - 30) * 1000, 1),
      ); // (key, value, ttl) 설정,
      // 계산하고 저장하기까지의 시간이 걸릴 수 있으므로 토큰 만료시간이 넘어서도 캐싱되지 않도록 안전 마진 시간 30초 빼기,
      // ttl은 최소 1ms가 보장되도록 Math.max 적용

      req.user = payload;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료됐습니다.');
      }
      next(); // 토큰 만료 이외의 예외 처리는 가드로 넘긴다.
    }
  }

  validateBeareToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    return token;
  }
}
