import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module.js';
import { RoleModule } from './role/role.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { Attendance } from './attendance/entities/attendance.entity.js';
import { Role } from './role/entities/role.entity.js';
import { User } from './user/entities/user.entity.js';



@Module({
  imports: [TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Attendance, User, Role],
      synchronize: false,
    }), UserModule, RoleModule, AttendanceModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
