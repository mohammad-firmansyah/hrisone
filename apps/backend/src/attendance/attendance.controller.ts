import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttendanceService } from './attendance.service.js';
import { ClockInPayload, ClockOutPayload, ListAllPayload, PhotoRequestPayload } from './dto/create-attendance.dto.js';

// Intentionally no update/remove patterns: attendance logs are append-only.
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern('attendance.status')
  status(@Payload() p: { userId: number }) {
    return this.attendanceService.status(Number(p.userId));
  }

  @MessagePattern('attendance.clockIn')
  clockIn(@Payload() p: ClockInPayload) {
    return this.attendanceService.clockIn({ ...p, userId: Number(p.userId) });
  }

  @MessagePattern('attendance.clockOut')
  clockOut(@Payload() p: ClockOutPayload) {
    return this.attendanceService.clockOut({ ...p, userId: Number(p.userId) });
  }

  @MessagePattern('attendance.mine')
  mine(@Payload() p: { userId: number }) {
    return this.attendanceService.mine(Number(p.userId));
  }

  @MessagePattern('attendance.all')
  all(@Payload() p: ListAllPayload) {
    return this.attendanceService.all({ ...p, requesterId: Number(p.requesterId) });
  }

  @MessagePattern('attendance.photo')
  photo(@Payload() p: PhotoRequestPayload) {
    return this.attendanceService.photo({ ...p, requesterId: Number(p.requesterId) });
  }
}
