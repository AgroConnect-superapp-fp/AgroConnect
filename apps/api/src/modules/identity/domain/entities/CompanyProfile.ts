import { InvalidDataError } from '../errors/AuthErrors';

export interface CompanyProfileProps {
  id: string;
  userId: string;
  companyName: string;
  nit: string;
  address?: string;
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
}
