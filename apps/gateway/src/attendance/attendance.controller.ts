import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('attendance')
export class AttendanceController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createAttendanceDto: any) {
    return firstValueFrom(
      this.backendClient.send('createAttendance', createAttendanceDto),
    );
  }

  @Get()
  findAll() {
    return firstValueFrom(this.backendClient.send('findAllAttendance', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.backendClient.send('findOneAttendance', +id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttendanceDto: any) {
    return firstValueFrom(
      this.backendClient.send('updateAttendance', {
        id: +id,
        ...updateAttendanceDto,
      }),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.backendClient.send('removeAttendance', +id));
  }
}
