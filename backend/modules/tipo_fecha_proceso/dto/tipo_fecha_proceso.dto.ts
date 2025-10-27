import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTipoFechaProcesoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  nombre!: string;
}

export class UpdateTipoFechaProcesoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;
}
