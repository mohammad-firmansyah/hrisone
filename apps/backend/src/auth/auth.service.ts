import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity.js';
import { PublicUser } from '../common/rpc.js';
import { getDummyHash, verifyPassword } from './password.js';

function toPublic(u: User): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role.name, sessionVersion: u.session_version };
}

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  /** Returns the user on valid credentials, otherwise null. Same work either way. */
  async login(email: string, password: string): Promise<PublicUser | null> {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.password')
      .innerJoinAndSelect('u.role', 'role')
      .where('u.email = :email', { email: email.trim().toLowerCase() })
      .getOne();

    const ok = await verifyPassword(password, user?.password ?? (await getDummyHash()));
    // Deactivated users are rejected after the hash check to keep timing uniform.
    if (!user || !ok || !user.status) return null;
    return toPublic(user);
  }

  /** Re-validates a JWT's subject on every request: must exist, be active, and match session version. */
  async session(id: number, sessionVersion: number): Promise<PublicUser | null> {
    const user = await this.users.findOne({ where: { id }, relations: { role: true } });
    if (!user || !user.status || user.session_version !== sessionVersion) return null;
    return toPublic(user);
  }

  /** Invalidates every outstanding JWT for this user. */
  async logout(id: number): Promise<void> {
    await this.users.increment({ id }, 'session_version', 1);
  }
}
