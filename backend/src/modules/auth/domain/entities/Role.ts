import { RoleNotFoundError } from '../errors/AuthErrors';

export const ROLE_NAMES = [
  'productor',
  'comprador_b2c',
  'comprador_b2b',
  'transportista',
  'administrador',
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export interface RoleProps {
  id: string;
  name: RoleName;
  description: string;
}

const PRODUCER_ROLES: readonly RoleName[] = ['productor'];
const COMPANY_ROLES: readonly RoleName[] = ['comprador_b2b'];

export class Role {
  private constructor(private readonly props: RoleProps) {}

  static create(props: RoleProps): Role {
    if (!ROLE_NAMES.includes(props.name)) {
      throw new RoleNotFoundError(props.name);
    }
    return new Role(props);
  }

  static isValidName(value: string): value is RoleName {
    return (ROLE_NAMES as readonly string[]).includes(value);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): RoleName {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  requiresProducerProfile(): boolean {
    return PRODUCER_ROLES.includes(this.props.name);
  }

  requiresCompanyProfile(): boolean {
    return COMPANY_ROLES.includes(this.props.name);
  }
}
