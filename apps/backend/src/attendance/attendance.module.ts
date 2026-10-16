import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service.js';
import { AttendanceController } from './attendance.controller.js';
import { Attendance } from './entities/attendance.entity.js';
import { User } from '../user/entities/user.entity.js';
import { PhotoStorage } from './photo-storage.js';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, User])],
  controllers: [AttendanceController],
  providers: [AttendanceService, PhotoStorage],
})
export class AttendanceModule {}
