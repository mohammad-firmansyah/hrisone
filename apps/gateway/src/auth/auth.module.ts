import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'hrisone-jwt-super-secret-key-development-2026-min-32-chars';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    ClientsModule.register([
      {
        name: 'BACKEND_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule, ClientsModule],
})
export class AuthModule {}
