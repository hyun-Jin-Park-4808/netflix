import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { envVarableKeys } from 'src/common/const/env.const';
import { Role, User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async blockToken(token: string) {
    const payload = await this.jwtService.decode(token);
    const expiryDate = +new Date(payload['exp'] * 1000); // 숫자(ms)로 변환하기 위해 +붙임.
    const now = +new Date();
    const differenceInSeconds = (expiryDate - now) / 1000; // 초 단위로 변환하기 위해 /1000 적용.
    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(differenceInSeconds * 1000, 1),
    );

    return true;
  }

  parseBasicToken(rawToken: string) {
    // 1) 토큰을 ' '기준으로 스플릿한 후 토큰 값 추출하기
    // ['Basic', '$token']
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    // 2) 토큰을 Base64로 디코딩해서 이메일과 비밀번호로 나눈다.
    // Base64로 인코딩된 token을 utf-8로 변환한다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8'); // "email:password"

    // 3) 토큰을 스플릿하여 토큰 값을 추출한다.
    // ['email', 'password']
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    const [email, password] = tokenSplit;

    return { email, password };
  }

  // 미들웨어로 옮긴 코드
  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    try {
      // verifyAsync(): token을 디코딩해 payload를 가져옴과 동시에 원하는 secret으로 인코딩됐는지 검증한다.
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVarableKeys.refreshTokenSecret
            : envVarableKeys.accessTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh Token을 입력해주세요.');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access Token을 입력해주세요.');
        }
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('토큰이 만료됐습니다.');
    }
  }

  // rawToken => "Basic $token" 형태로 Base64로 인코딩되어 있다. 여기서 token을 추출해야한다.
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    return await this.userService.create({ email, password });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVarableKeys.refreshTokenSecret,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVarableKeys.accessTokenSecret,
    );

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
