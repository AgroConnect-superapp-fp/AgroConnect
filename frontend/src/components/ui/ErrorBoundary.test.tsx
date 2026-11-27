// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('../../shared/observability/reportClientError', () => ({
  reportClientError: vi.fn(),
}));

import { reportClientError } from '../../shared/observability/reportClientError';

function Broken(): React.ReactElement {
  throw new Error('boom');
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('muestra el fallback, reporta y llama onError', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Broken />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.any(String)
    );
    expect(onError).toHaveBeenCalled();
  });
});
