import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service.js';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern('auth.login')
  login(@Payload() p: { email: string; password: string }) {
    return this.auth.login(String(p.email), String(p.password));
  }

  @MessagePattern('auth.session')
  session(@Payload() p: { id: number; sessionVersion: number }) {
    return this.auth.session(Number(p.id), Number(p.sessionVersion));
  }

  @MessagePattern('auth.logout')
  async logout(@Payload() p: { id: number }) {
    await this.auth.logout(Number(p.id));
    return { ok: true };
  }
}
