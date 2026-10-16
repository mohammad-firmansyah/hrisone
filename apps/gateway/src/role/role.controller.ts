import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('roles')
export class RoleController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createRoleDto: any) {
    return firstValueFrom(this.backendClient.send('createRole', createRoleDto));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.backendClient.send('findAllRole', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.backendClient.send('findOneRole', +id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: any) {
    return firstValueFrom(
      this.backendClient.send('updateRole', { id: +id, ...updateRoleDto }),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.backendClient.send('removeRole', +id));
  }
}
