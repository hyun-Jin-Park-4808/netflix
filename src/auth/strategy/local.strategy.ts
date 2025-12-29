import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('codefactory') {} // codefactory를 직접 입력안하고 LocalAuthGuard를 @UseGuards 안에 넣어서 사용할 수 있다.

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'codefactory') {
  // 기본 이름은 local인데, 'codefacoty' 처럼 이름을 직접 지정할 수 있다.
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // username 필드명을 email로 변경한다.
    });
  }

  /**
   * Local Strategy
   * validate: username, password 로 인증하는 전략이 Local Strategy임, constructor에서 usernameField를 email로 변경 가능하다.
   * return -> Requst();에서 전달되는 user
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);

    return user;
  }
}
