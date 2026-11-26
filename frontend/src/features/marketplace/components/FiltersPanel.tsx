import { Button } from '../../../shared/ui';

interface FiltersPanelProps {
  showProductiveZones: boolean;
  enableDrawing: boolean;
  onToggleProductiveZones: () => void;
  onToggleDrawing: () => void;
}

/**
 * Controles del mapa. Se mantienen como `aria-pressed` para que el estado
 * ON/OFF no dependa solo del color y sea perceptible con lector de pantalla.
 */
export function FiltersPanel({
  showProductiveZones,
  enableDrawing,
  onToggleProductiveZones,
  onToggleDrawing,
}: FiltersPanelProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={showProductiveZones ? 'secondary' : 'ghost'}
        aria-pressed={showProductiveZones}
        onClick={onToggleProductiveZones}
        className="min-w-[220px] px-4 py-2 text-sm whitespace-nowrap"
      >
        📊 Zonas Productivas {showProductiveZones ? 'ON' : 'OFF'}
      </Button>
      <Button
        variant={enableDrawing ? 'primary' : 'ghost'}
        aria-pressed={enableDrawing}
        onClick={onToggleDrawing}
        className="min-w-[220px] px-4 py-2 text-sm whitespace-nowrap"
      >
        ✏️ Dibujar Parcelas {enableDrawing ? 'ON' : 'OFF'}
      </Button>
    </div>
  );
}
