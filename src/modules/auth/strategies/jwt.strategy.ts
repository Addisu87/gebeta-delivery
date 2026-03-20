import { Injectable } from '@nestjs/common';

type JwtPayload = {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy {
  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
