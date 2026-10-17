import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('createUser')
  create(@Payload() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @MessagePattern('findAllUser')
  findAll() {
    return this.userService.findAll();
  }

  @MessagePattern('findOneUser')
  findOne(@Payload() id: number | { id: number }) {
    const numId = typeof id === 'object' && id !== null ? Number(id.id) : Number(id);
    return this.userService.findOne(numId);
  }

  @MessagePattern('updateUser')
  update(@Payload() updateUserDto: UpdateUserDto) {
    return this.userService.update(Number(updateUserDto.id), updateUserDto);
  }

  @MessagePattern('removeUser')
  remove(@Payload() id: number | { id: number }) {
    const numId = typeof id === 'object' && id !== null ? Number(id.id) : Number(id);
    return this.userService.remove(numId);
  }
}
