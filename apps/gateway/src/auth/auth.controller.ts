import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Inject,
  UnauthorizedException,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from './auth.guard.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    sessionVersion: number;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post('login')
  async login(
    @Body() body: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required.');
    }

    // Call backend microservice via TCP
    const user = await firstValueFrom(
      this.backendClient.send('auth.login', { email, password }),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Issue JWT token
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    });

    // Set HttpOnly, SameSite=Lax cookie for browser security
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('hris_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token, // Also returned for client convenience (e.g. mobile/postman)
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.user?.id) {
      // Invalidate session in backend
      await firstValueFrom(
        this.backendClient.send('auth.logout', { id: req.user.id }),
      );
    }

    // Clear session cookie
    res.clearCookie('hris_session', { path: '/' });

    return { message: 'Logged out successfully.' };
  }
}
