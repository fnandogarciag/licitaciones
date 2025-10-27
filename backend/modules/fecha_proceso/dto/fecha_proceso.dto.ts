import {
  IsOptional,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

export class CreateFechaProcesoDto {
  @IsInt()
  @IsNotEmpty()
  procesoId!: number;

  @IsInt()
  @IsNotEmpty()
  tipoFechaProcesoId!: number;

  @IsOptional()
  @IsISO8601()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  importante?: boolean;
}

export class UpdateFechaProcesoDto {
  @IsOptional()
  @IsInt()
  procesoId?: number;

  @IsOptional()
  @IsInt()
  tipoFechaProcesoId?: number;

  @IsOptional()
  @IsISO8601()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  importante?: boolean;
}
