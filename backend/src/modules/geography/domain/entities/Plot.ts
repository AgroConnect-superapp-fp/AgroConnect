// 🏛️ DOMAIN LAYER - Entidad Pura (No conoce Express, No conoce Prisma)

export class Plot {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly areaHectares: number,
    public readonly municipality: string,
    public readonly department: string,
    public readonly farmerId: string,
    public readonly createdAt?: Date
  ) {}

  // Reglas de negocio puras (ej. validación de dominio)
  isLocatedInQuindio(): boolean {
    return this.department === 'Quindío';
  }
}
