/**
 * Estado de apertura del buscador del mapa.
 *
 * El buscador de Leaflet se monta como control imperativo; este hook conserva
 * el estado de visibilidad y el foco del input, que es lo único que React
 * necesita controlar del ciclo de vida de la búsqueda.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MAP_CONSTANTS } from '../components/maps/mapConstants';

const FOCUS_DELAY_MS = 150;

export interface UseMapSearchResult {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export function useMapSearch(initiallyOpen = true): UseMapSearchResult {
  const [isSearchOpen, setIsSearchOpen] = useState(initiallyOpen);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFocusTimer = useCallback((): void => {
    if (focusTimerRef.current !== null) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearFocusTimer, [clearFocusTimer]);

  const openSearch = useCallback((): void => {
    setIsSearchOpen(true);
    clearFocusTimer();

    focusTimerRef.current = setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `.${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} input`
      );

      if (input) {
        input.focus();
        input.select();
      }

      focusTimerRef.current = null;
    }, FOCUS_DELAY_MS);
  }, [clearFocusTimer]);

  const closeSearch = useCallback((): void => {
    clearFocusTimer();
    setIsSearchOpen(false);
  }, [clearFocusTimer]);

  return { isSearchOpen, openSearch, closeSearch };
}
