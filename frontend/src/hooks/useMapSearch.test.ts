// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAP_CONSTANTS } from '../components/maps/mapConstants';
import { useMapSearch } from './useMapSearch';

function mountSearchDom(): HTMLInputElement {
  document.body.innerHTML = `
    <div class="${MAP_CONSTANTS.MAP_WRAPPER_CLASS}">
      <div class="${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS}">
        <input />
      </div>
    </div>
  `;

  return document.querySelector<HTMLInputElement>('input')!;
}

describe('useMapSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('arranca abierto por defecto', () => {
    const { result } = renderHook(() => useMapSearch());

    expect(result.current.isSearchOpen).toBe(true);
  });

  it('permite cerrar y volver a abrir el buscador', () => {
    const { result } = renderHook(() => useMapSearch());

    act(() => result.current.closeSearch());
    expect(result.current.isSearchOpen).toBe(false);

    act(() => result.current.openSearch());
    expect(result.current.isSearchOpen).toBe(true);
  });

  it('enfoca y selecciona el input después del retardo de apertura', () => {
    const input = mountSearchDom();
    const focusSpy = vi.spyOn(input, 'focus');
    const selectSpy = vi.spyOn(input, 'select');
    const { result } = renderHook(() => useMapSearch(false));

    act(() => result.current.openSearch());
    act(() => vi.advanceTimersByTime(150));

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(selectSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(input);
  });

  it('cancela el foco pendiente si se cierra o se desmonta', () => {
    const input = mountSearchDom();
    const focusSpy = vi.spyOn(input, 'focus');
    const { result, unmount } = renderHook(() => useMapSearch(false));

    act(() => result.current.openSearch());
    act(() => result.current.closeSearch());
    act(() => vi.advanceTimersByTime(150));
    expect(focusSpy).not.toHaveBeenCalled();

    act(() => result.current.openSearch());
    unmount();
    act(() => vi.advanceTimersByTime(150));
    expect(focusSpy).not.toHaveBeenCalled();
  });
});
