import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
// import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { access } from 'fs';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiBasicAuth()
  @Post('register')
  // authorization: Basic $token
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
  }

  @Public()
  @ApiBasicAuth()
  @Post('login')
  // authorization: Basic $token
  loginUser(@Authorization() token: string) {
    return this.authService.login(token);
  }

  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.blockToken(token);
  }

  @UseGuards(LocalAuthGuard) // 아래랑 똑같은 기능, codefactory를 직접 입력하지 않아도 된다.
  // @UseGuards(AuthGuard('codefactory')) // codefactory 전략을 써서 인증하겠다. codefactory strategy에 정의한 validate 메소드를 호출하고 그 반환값이 Request 객체로 넘겨진다.
  @Post('login/passport')
  async loginUserPassport(@Request() req: any) {
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req: any) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(JwtAuthGuard) // 가드 통과 안하면 아예 아래 요청 로직 실행 안된다.
  @Get('private')
  async private(@Request() req: any) {
    return req.user;
  }
}
