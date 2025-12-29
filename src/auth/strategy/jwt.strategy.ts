import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtAuthGuard extends AuthGuard('jwt') {} // jwt를 직접 입력안하고 JwtAuthGuard를 @UseGuards 안에 넣어서 사용할 수 있다.

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer 헤더에 JWT 토큰을 추출한다. 어디서 jwt를 추출할지 지정하는 부분이다.
      ignoreExpiration: false, // 만료기간 무시하고 검증할지 여부
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'), // JWT 토큰을 검증할 때 사용하는 비밀키
    });
  }

  validate(payload: any) {
    return payload;
  }
}
