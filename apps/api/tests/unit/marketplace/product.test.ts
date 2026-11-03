import { Product } from '../../../src/modules/marketplace/domain/entities/Product';

describe('Product (entidad de dominio)', () => {
  const product = new Product({
    id: 'product-1',
    name: 'Finca La Esperanza',
    owner: 'Carlos Martínez',
    department: 'Cundinamarca',
    municipality: 'La Mesa',
    crop: 'coffee',
    area: 50,
    productivity: 85,
    certification: 'organic',
    lat: 4.6249,
    lng: -74.0679,
    images: [],
    coordinates: [],
  });

  it('expone los datos del producto', () => {
    expect(product.id).toBe('product-1');
    expect(product.name).toBe('Finca La Esperanza');
    expect(product.props.area).toBe(50);
    expect(product.props.department).toBe('Cundinamarca');
  });

  it('identifica productos orgánicos', () => {
    expect(product.isOrganic()).toBe(true);
    expect(
      new Product({ ...product.props, id: 'product-2', certification: 'conventional' }).isOrganic(),
    ).toBe(false);
  });
});
