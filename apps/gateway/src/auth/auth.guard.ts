import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 1. Extract token from HttpOnly cookie or Authorization Bearer header
    const token =
      req.cookies?.hris_session ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    // 2. Verify JWT signature & expiration
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    // 3. Verify session version with backend microservice (revocation check)
    const user = await firstValueFrom(
      this.backendClient.send('auth.session', {
        id: payload.sub,
        sessionVersion: payload.sessionVersion,
      }),
    );

    if (!user) {
      throw new UnauthorizedException('Session expired or user deactivated.');
    }

    req.user = user;

    // 4. Role check if required
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = (user.role || '').toUpperCase();
      const hasRole = requiredRoles.some((r) => r.toUpperCase() === userRole);
      if (!hasRole) {
        throw new ForbiddenException('Access denied for this role.');
      }
    }

    return true;
  }
}
