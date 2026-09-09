import type { Id } from './api';

export interface User {
  id: Id;
  email: string;
  name: string;
  roles?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  user: User;
}

export interface Session {
  token: string;
  refreshToken?: string;
  user: User;
}
