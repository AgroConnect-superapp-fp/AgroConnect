import { InvalidDataError } from '../errors/AuthErrors';

export interface ProducerProfileProps {
  id: string;
  userId: string;
  farmName: string;
  municipality: string;
  village: string;
  latitude?: number;
  longitude?: number;
}

export class ProducerProfile {
  private constructor(private readonly props: ProducerProfileProps) {}

  static create(props: ProducerProfileProps): ProducerProfile {
    if (props.farmName.trim().length < 3) {
      throw new InvalidDataError('El nombre de la finca debe tener al menos 3 caracteres');
    }

    if (props.municipality.trim().length < 3) {
      throw new InvalidDataError('El municipio debe tener al menos 3 caracteres');
    }

    if (props.village.trim().length < 2) {
      throw new InvalidDataError('La vereda debe tener al menos 2 caracteres');
    }

    if (props.latitude !== undefined || props.longitude !== undefined) {
      const { latitude, longitude } = props;

      if (
        latitude === undefined ||
        longitude === undefined ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new InvalidDataError('Las coordenadas de la finca no son válidas');
      }
    }

    return new ProducerProfile(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get farmName(): string {
    return this.props.farmName;
  }

  get municipality(): string {
    return this.props.municipality;
  }

  get village(): string {
    return this.props.village;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }
}
