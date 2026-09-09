import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/** Starts MSW. Call before rendering the app when config.mocks.enabled. */
export async function enableMocking(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
  });
  // eslint-disable-next-line no-console
  console.info(
    '%c[mocks] MSW active — API calls are served from in-memory fixtures',
    'color:#4f46e5;font-weight:bold',
  );
}
