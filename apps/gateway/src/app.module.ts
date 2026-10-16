import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller.js';
import { UserController } from './user/user.controller.js';
import { RoleController } from './role/role.controller.js';
import { AttendanceController } from './attendance/attendance.controller.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BACKEND_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    UserController,
    RoleController,
    AttendanceController,
  ],
})
export class AppModule {}
