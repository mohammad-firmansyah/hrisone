import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export const ROLE_ADMIN = 'admin';

export function isAdminRole(roleName?: string): boolean {
  if (!roleName) return false;
  const upper = roleName.toUpperCase();
  return upper === 'ADMIN' || upper === 'SUPERADMIN';
}

/** Shape every RPC error takes so the gateway can map it to an HTTP status. */
export function rpcError(status: HttpStatus, message: string): RpcException {
  return new RpcException({ status, message });
}

/** Safe user shape sent across the wire. Never includes the password hash. */
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: string;
  sessionVersion: number;
}
