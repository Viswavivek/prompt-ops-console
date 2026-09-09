import type { User } from '@/types';

export interface MockCredential {
  email: string;
  password: string;
  user: User;
}

export const mockCredentials: MockCredential[] = [
  {
    email: 'demo@promptops.dev',
    password: 'demo1234',
    user: {
      id: '1',
      email: 'demo@promptops.dev',
      name: 'Demo Operator',
      roles: ['editor'],
    },
  },
  {
    email: 'viewer@promptops.dev',
    password: 'viewer1234',
    user: {
      id: '2',
      email: 'viewer@promptops.dev',
      name: 'Read-Only Viewer',
      roles: ['viewer'],
    },
  },
];
