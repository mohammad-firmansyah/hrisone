import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module.js';
import { RoleModule } from './role/role.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';



@Module({
  imports: [TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }), UserModule, RoleModule, AttendanceModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
