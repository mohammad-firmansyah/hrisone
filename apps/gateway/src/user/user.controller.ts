import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('users')
export class UserController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createUserDto: any) {
    return firstValueFrom(this.backendClient.send('createUser', createUserDto));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.backendClient.send('findAllUser', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.backendClient.send('findOneUser', +id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return firstValueFrom(
      this.backendClient.send('updateUser', { id: +id, ...updateUserDto }),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.backendClient.send('removeUser', +id));
  }
}
