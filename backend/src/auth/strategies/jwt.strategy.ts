import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWT_ACCESS_TOKEN_SECRET } from '@src/config/constants';
import { JwtPayload } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.getOrThrow<string>(JWT_ACCESS_TOKEN_SECRET);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    // Reject a refresh token presented as a bearer access token. Tokens
    // issued before this claim existed (no `tokenUse`) remain accepted
    // during the compatibility window.
    if (payload.tokenUse && payload.tokenUse !== 'access') {
      throw new UnauthorizedException();
    }

    return { id: payload.sub, email: payload.email };
  }
}
