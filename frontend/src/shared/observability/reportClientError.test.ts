// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildClientErrorPayload, reportClientError } from './reportClientError';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('reportClientError', () => {
  it('no hace red si no hay endpoint configurado', () => {
    const sendBeacon = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon });
    expect(reportClientError(new Error('x'))).toBe(false);
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('envía solo ruta y mensaje, sin query ni hash', async () => {
    vi.stubEnv('VITE_ERROR_REPORT_URL', 'https://errors.example/collect');
    window.history.pushState({}, '', '/marketplace?token=secreto#top');
    let blob: Blob | undefined;
    const sendBeacon = vi.fn((_url: string, data: Blob) => {
      blob = data;
      return true;
    });
    vi.stubGlobal('navigator', { sendBeacon });

    expect(reportClientError(new Error('falló la carga'), 'component stack')).toBe(true);
    expect(sendBeacon).toHaveBeenCalledWith(
      'https://errors.example/collect',
      expect.any(Blob)
    );

    const payload = JSON.parse(await blob!.text());
    expect(payload).toMatchObject({
      type: 'client-error',
      message: 'falló la carga',
      route: '/marketplace',
      componentStack: 'component stack',
    });
    expect(JSON.stringify(payload)).not.toContain('secreto');
    expect(payload.stack).toBeUndefined();
  });

  it('usa fetch si sendBeacon no puede enviar', () => {
    vi.stubEnv('VITE_ERROR_REPORT_URL', 'https://errors.example/collect');
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => false) });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    expect(reportClientError(new Error('sin beacon'))).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://errors.example/collect',
      expect.objectContaining({ method: 'POST', keepalive: true })
    );
  });

  it('trunca mensajes y stacks largos', () => {
    const payload = buildClientErrorPayload(
      new Error('x'.repeat(600)),
      'y'.repeat(2_100)
    );
    expect(payload.message).toHaveLength(501);
    expect(payload.componentStack).toHaveLength(2_001);
  });
});
