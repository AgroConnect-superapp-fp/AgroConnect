export type RoleName =
  'productor' | 'comprador_b2c' | 'comprador_b2b' | 'transportista' | 'administrador';

export interface PublicUser {
  id: string;
  nombre: string;
  correo: string;
  rol: RoleName;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  verificado: boolean;
  fechaRegistro: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  usuario: PublicUser;
  tokens: SessionTokens;
}

export interface ProducerFarmInput {
  nombre: string;
  municipio: string;
  vereda: string;
  latitud?: number;
  longitud?: number;
}

export interface CompanyInput {
  razonSocial: string;
  nit: string;
  direccion?: string;
}

export interface RegisterPayload {
  nombre: string;
  documento: string;
  correo: string;
  celular: string;
  password: string;
  rol: RoleName;
  finca?: ProducerFarmInput;
  empresa?: CompanyInput;
  aceptaTratamientoDatos: boolean;
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RoleOption {
  id: RoleName;
  titulo: string;
  descripcion: string;
  icono: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'productor',
    titulo: 'Productor',
    descripcion: 'Publica y vende tus cosechas directamente, sin intermediarios.',
    icono: '🌱',
  },
  {
    id: 'comprador_b2c',
    titulo: 'Comprador',
    descripcion: 'Compra productos frescos del campo para tu hogar.',
    icono: '🛒',
  },
  {
    id: 'comprador_b2b',
    titulo: 'Empresa',
    descripcion: 'Abastece tu restaurante, plaza o distribuidora con cosechas locales.',
    icono: '🏢',
  },
  {
    id: 'transportista',
    titulo: 'Transportista',
    descripcion: 'Transporta cosechas entre el productor y el comprador.',
    icono: '🚚',
  },
  {
    id: 'administrador',
    titulo: 'Administrador',
    descripcion: 'Gestiona la plataforma y acompaña a la comunidad.',
    icono: '🛡️',
  },
];

export function getRoleOption(role: RoleName): RoleOption {
  return ROLE_OPTIONS.find((option) => option.id === role) ?? ROLE_OPTIONS[0];
}

export const ROLE_LABELS: Record<RoleName, string> = {
  productor: 'Productor agrícola',
  comprador_b2c: 'Comprador',
  comprador_b2b: 'Empresa compradora',
  transportista: 'Transportista',
  administrador: 'Administrador',
};
