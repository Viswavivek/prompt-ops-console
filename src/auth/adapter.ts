import { config } from '@/config';
import { jwtAdapter } from './jwtAdapter';
import type { AuthAdapter } from './types';

/** Selects the auth adapter from config. Add new mechanisms here. */
export function resolveAuthAdapter(): AuthAdapter {
  switch (config.auth.mode) {
    case 'jwt':
      return jwtAdapter;
    default:
      return jwtAdapter;
  }
}

export const authAdapter = resolveAuthAdapter();
