// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Field } from './Field';
import { Input } from './Input';
import { Modal } from './Modal';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';
import { Toast, ToastProvider } from './Toast';
import { useToast } from './toastContext';

afterEach(() => {
  cleanup();
});

async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // jsdom no calcula contraste real (no hay layout ni canvas).
      'color-contrast': { enabled: false },
    },
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });

  expect(results.violations).toEqual([]);
}

describe('Button', () => {
  it('renderiza la variante, ejecuta la acción y anuncia el estado de carga', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button variant="danger" onClick={onClick}>
        Eliminar
      </Button>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.firstElementChild?.className).toContain('bg-red-600');
  });

  it('se deshabilita y marca aria-busy mientras carga', () => {
    render(<Button loading>Cargando</Button>);
    const button = screen.getByRole('button', { name: 'Cargando' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('Field e Input', () => {
  it('asocia etiqueta, error y estado inválido', async () => {
    const { container } = render(
      <Field
        id="correo"
        label="Correo"
        help="Usa tu correo registrado"
        error="Correo inválido"
      >
        <Input id="correo" invalid aria-describedby="correo-help correo-error" />
      </Field>
    );
    const input = screen.getByLabelText(/Correo/);

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'correo-help correo-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido');
    await expectNoAxeViolations(container);
  });

  it('muestra la ayuda cuando no hay error', () => {
    render(
      <Field id="clave" label="Contraseña" help="Mínimo 8 caracteres">
        <Input id="clave" type="password" aria-describedby="clave-help" />
      </Field>
    );

    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Card y Badge', () => {
  it('renderiza contenido y tono de estado', async () => {
    const { container } = render(
      <Card padding="lg">
        <Badge tone="success">Aprobado</Badge>
        <p>Café del Quindío</p>
      </Card>
    );

    expect(screen.getByText('Aprobado').className).toContain('bg-emerald-100');
    expect(screen.getByText('Café del Quindío')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('Alert', () => {
  it('usa role alert para errores y permite cerrarlo', () => {
    const onDismiss = vi.fn();
    render(
      <Alert tone="danger" title="Error" onDismiss={onDismiss}>
        No se pudo guardar
      </Alert>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('usa role status para información', () => {
    render(<Alert tone="info">Dato informativo</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it('es decorativo por defecto y anunciado si recibe label', () => {
    const { rerender } = render(<Skeleton />);
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();

    rerender(<Skeleton label="Cargando catálogo" />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando catálogo');
  });
});

describe('EmptyState y ErrorState', () => {
  it('EmptyState titula el estado y muestra la acción', async () => {
    const { container } = render(
      <EmptyState
        title="Sin parcelas"
        description="Registra tu primera parcela."
        action={<Button>Registrar</Button>}
      />
    );

    expect(screen.getByRole('heading', { name: 'Sin parcelas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('ErrorState anuncia el fallo y permite reintentar', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Pagination', () => {
  it('bloquea Anterior en la primera página y avanza con Siguiente', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={10} total={25} onPageChange={onPageChange} />);

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('no renderiza nada sin resultados', () => {
    const { container } = render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Modal', () => {
  it('expone un diálogo con nombre accesible y cierra con su botón', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Detalle de la parcela" onClose={onClose}>
        Contenido
      </Modal>
    );

    expect(
      screen.getByRole('dialog', { name: 'Detalle de la parcela' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function ToastHarness(): React.ReactElement {
  const { showToast } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => showToast('Producto aprobado', { tone: 'success' })}
      >
        Mostrar
      </button>
      <button
        type="button"
        onClick={() => showToast('Fallo persistente', { tone: 'danger', durationMs: 0 })}
      >
        Mostrar error
      </button>
    </div>
  );
}

describe('Toast', () => {
  it('anuncia el aviso y lo cierra con su botón', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo persistente');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByText('Fallo persistente')).not.toBeInTheDocument();
  });

  it('auto-cierra los avisos con duración', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <ToastHarness />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
      expect(screen.getByRole('status')).toHaveTextContent('Producto aprobado');

      act(() => {
        vi.advanceTimersByTime(5_000);
      });

      expect(screen.queryByText('Producto aprobado')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('el componente individual es accesible', async () => {
    const { container } = render(
      <Toast message="Cambios guardados" tone="success" onDismiss={vi.fn()} />
    );
    await expectNoAxeViolations(container);
  });
});
