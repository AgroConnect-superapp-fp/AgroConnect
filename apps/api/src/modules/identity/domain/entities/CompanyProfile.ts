import { InvalidDataError } from '../errors/AuthErrors';

export type CompanyType =
  'restaurante' | 'plaza_mercado' | 'distribuidor' | 'supermercado' | 'exportador' | 'otro';

export interface CompanyProfileProps {
  id: string;
  userId: string;
  companyName: string;
  nit: string;
  address?: string;
  companyType?: CompanyType;
  department?: string;
  municipality?: string;
}

const NIT_REGEX = /^\d{9,10}(-\d)?$/;

export class CompanyProfile {
  private constructor(private readonly props: CompanyProfileProps) {}

  static create(props: CompanyProfileProps): CompanyProfile {
    if (props.companyName.trim().length < 3) {
      throw new InvalidDataError('La razón social debe tener al menos 3 caracteres');
    }

    if (!NIT_REGEX.test(props.nit.trim())) {
      throw new InvalidDataError(
        'El NIT debe tener 9 o 10 dígitos, con guion y dígito de verificación opcional',
      );
    }

    if (props.department !== undefined && props.department.trim().length < 2) {
      throw new InvalidDataError('El departamento debe tener al menos 2 caracteres');
    }

    if (props.municipality !== undefined && props.municipality.trim().length < 2) {
      throw new InvalidDataError('El municipio debe tener al menos 2 caracteres');
    }

    return new CompanyProfile(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get nit(): string {
    return this.props.nit;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get companyType(): CompanyType | undefined {
    return this.props.companyType;
  }

  get department(): string | undefined {
    return this.props.department;
  }

  get municipality(): string | undefined {
    return this.props.municipality;
  }
}
