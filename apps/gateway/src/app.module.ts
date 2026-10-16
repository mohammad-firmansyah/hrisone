import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { UserController } from './user/user.controller.js';
import { RoleController } from './role/role.controller.js';
import { AttendanceController } from './attendance/attendance.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [
    AppController,
    UserController,
    RoleController,
    AttendanceController,
  ],
})
export class AppModule {}
