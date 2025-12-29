import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    // 1) 토큰을 ' '기준으로 스플릿한 후 토큰 값 추출하기
    // ['Basic', '$token']
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    const [_, token] = basicSplit;

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

  // rawToken => "Basic $token" 형태로 Base64로 인코딩되어 있다. 여기서 token을 추출해야한다.
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new BadRequestException('이미 존재하는 사용자입니다.');
    }

    // Round 넣어주면 salt값은 알아서 생성된다.
    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS'),
    );

    await this.userRepository.save({ email, password: hash });

    return this.userRepository.findOne({ where: { email } });
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

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    const user = await this.authenticate(email, password);

    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );
    return {
      refreshToken: await this.jwtService.signAsync(
        { sub: user.id, role: user.role, type: 'refresh' },
        { expiresIn: '24h', secret: refreshTokenSecret },
      ),
      accessToken: await this.jwtService.signAsync(
        { sub: user.id, role: user.role, type: 'access' },
        { expiresIn: 300, secret: accessTokenSecret },
      ),
    };
  }
}
