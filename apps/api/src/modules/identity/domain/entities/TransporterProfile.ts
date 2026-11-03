import { InvalidDataError } from '../errors/AuthErrors';

export type VehicleType = 'camion' | 'camioneta' | 'moto' | 'furgon';

export interface TransporterProfileProps {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  plate: string;
  capacityKg: number;
  coverageMunicipalities: string[];
  coldChain: boolean;
  soatExpiresAt: Date;
  licenseExpiresAt: Date;
}

const PLATE_REGEX = /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/;

export class TransporterProfile {
  private constructor(private readonly props: TransporterProfileProps) {}

  static create(props: TransporterProfileProps): TransporterProfile {
    const plate = props.plate.trim().toUpperCase();

    if (!PLATE_REGEX.test(plate)) {
      throw new InvalidDataError('La placa debe tener el formato ABC123 o ABC12D');
    }

    if (!Number.isFinite(props.capacityKg) || props.capacityKg <= 0) {
      throw new InvalidDataError('La capacidad debe ser mayor que cero');
    }

    if (props.coverageMunicipalities.length === 0 || props.coverageMunicipalities.length > 20) {
      throw new InvalidDataError('Indica entre 1 y 20 municipios de cobertura');
    }

    if (props.soatExpiresAt.getTime() < Date.now()) {
      throw new InvalidDataError('El SOAT debe estar vigente');
    }

    if (props.licenseExpiresAt.getTime() < Date.now()) {
      throw new InvalidDataError('La licencia debe estar vigente');
    }

    return new TransporterProfile({ ...props, plate });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get vehicleType(): VehicleType {
    return this.props.vehicleType;
  }

  get plate(): string {
    return this.props.plate;
  }

  get capacityKg(): number {
    return this.props.capacityKg;
  }

  get coverageMunicipalities(): string[] {
    return this.props.coverageMunicipalities;
  }

  get coldChain(): boolean {
    return this.props.coldChain;
  }

  get soatExpiresAt(): Date {
    return this.props.soatExpiresAt;
  }

  get licenseExpiresAt(): Date {
    return this.props.licenseExpiresAt;
  }
}
