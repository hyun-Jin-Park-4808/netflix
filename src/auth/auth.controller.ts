import { Controller, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './strategy/local.strategy';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // authorization: Basic $token
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Post('login')
  // authorization: Basic $token
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @UseGuards(LocalAuthGuard) // 아래랑 똑같은 기능, codefactory를 직접 입력하지 않아도 된다.
  // @UseGuards(AuthGuard('codefactory')) // codefactory 전략을 써서 인증하겠다. codefactory strategy에 정의한 validate 메소드를 호출하고 그 반환값이 Request 객체로 넘겨진다.
  @Post('login/passport')
  loginUserPassport(@Request() req: any) {
    return req.user;
  }
}
