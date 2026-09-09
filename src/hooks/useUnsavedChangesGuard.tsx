import { useCallback, useEffect, useState } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

/**
 * Blocks in-app navigation and browser unload while `dirty` is true.
 * Renders its own confirm modal — mount <guard.Prompt /> once in the page.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const blockFn = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
    [dirty],
  );
  const blocker = useBlocker(blockFn);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(blocker.state === 'blocked');
  }, [blocker.state]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const Prompt = () => (
    <Modal
      open={open}
      onClose={() => blocker.reset?.()}
      title="Discard unsaved changes?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => blocker.reset?.()}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={() => blocker.proceed?.()}>
            Discard changes
          </Button>
        </>
      }
    >
      <p className="text-sm text-content-muted">
        You have edits that haven&rsquo;t been saved as a new version. Leaving now loses them.
      </p>
    </Modal>
  );

  return { Prompt };
}
