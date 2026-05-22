import { RecepcionDialogComponent } from './recepcion-dialog.component';
import { OrdenCompra } from '../../core/models';

const producto = {
  id: 10,
  nombre: 'Arroz',
  descripcion: '',
  codigo: 'ARZ-1',
  categoria: 'Granos',
  cantidadStock: 4,
  stockMinimo: 2,
  unidadMedida: 'kg',
  activo: true
};

const ordenBase: OrdenCompra = {
  id: 55,
  proveedor: { id: 1, nombre: 'Proveedor', rucNit: '123', email: '', telefono: '', direccion: '', activo: true },
  usuario: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN', activo: true, fechaCreacion: '' },
  fechaCreacion: '',
  fechaEsperada: '',
  estado: 'ENVIADA',
  observaciones: '',
  total: 0,
  detalles: [
    { id: 101, producto, cantidadSolicitada: 8, cantidadRecibida: 3, precioUnitario: 1000 },
    { id: 102, producto: { ...producto, id: 11, nombre: 'Frijol', codigo: 'FRJ-1' }, cantidadSolicitada: 5, cantidadRecibida: 0, precioUnitario: 1200 }
  ]
};

function inputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}

describe('RecepcionDialogComponent', () => {
  function setup(orden: OrdenCompra = ordenBase) {
    const dialogRef = { close: jest.fn() };
    const component = new RecepcionDialogComponent(dialogRef as never, { orden });
    return { component, dialogRef };
  }

  it('no confirma si no hay cantidades nuevas', () => {
    const { component, dialogRef } = setup();

    expect(component.hayCantidades()).toBe(false);
    component.confirmar();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('confirma solo cantidades positivas calculadas desde las lineas de la orden', () => {
    const { component, dialogRef } = setup();
    const [detalle] = ordenBase.detalles;

    component.setCantidad(detalle, inputEvent('2'));

    expect(component.hayCantidades()).toBe(true);
    component.confirmar();

    expect(dialogRef.close).toHaveBeenCalledWith([{ detalleId: 101, cantidadRecibida: 2 }]);
  });

  it('bloquea la confirmacion mientras una cantidad excede el pendiente', () => {
    const { component, dialogRef } = setup();
    const [detalle] = ordenBase.detalles;

    component.setCantidad(detalle, inputEvent('9'));

    expect(component.errorRow().has(101)).toBe(true);
    expect(component.hayCantidades()).toBe(true);
    component.confirmar();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('sanea decimales antes de crear el payload', () => {
    const { component, dialogRef } = setup();
    const [, detalle] = ordenBase.detalles;

    component.setCantidad(detalle, inputEvent('3.8'));
    component.confirmar();

    expect(dialogRef.close).toHaveBeenCalledWith([{ detalleId: 102, cantidadRecibida: 3 }]);
  });
});
