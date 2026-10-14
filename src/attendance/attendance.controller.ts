import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttendanceService } from './attendance.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern('createAttendance')
  create(@Payload() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @MessagePattern('findAllAttendance')
  findAll() {
    return this.attendanceService.findAll();
  }

  @MessagePattern('findOneAttendance')
  findOne(@Payload() id: number) {
    return this.attendanceService.findOne(id);
  }

  @MessagePattern('updateAttendance')
  update(@Payload() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendanceService.update(updateAttendanceDto.id, updateAttendanceDto);
  }

  @MessagePattern('removeAttendance')
  remove(@Payload() id: number) {
    return this.attendanceService.remove(id);
  }
}
