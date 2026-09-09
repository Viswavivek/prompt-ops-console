import { useRouteError, useNavigate } from 'react-router-dom';
import { isApiError } from '@/services';
import { Button } from './Button';
import { ErrorState } from './States';

export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <ErrorState
        error={error}
        title={isApiError(error) && error.code === 'NOT_FOUND' ? 'Not found' : 'Page failed to load'}
      />
      <div className="mt-4 flex justify-center">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
