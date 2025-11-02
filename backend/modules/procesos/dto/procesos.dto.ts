import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateProcesoDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  objeto?: string;

  @IsOptional()
  @IsInt()
  entidadId?: number;

  @IsOptional()
  @IsInt()
  estadoId?: number;

  @IsOptional()
  @IsInt()
  tipoProcesoId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  codigoLink?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  anticipo?: number;

  @IsOptional()
  @IsBoolean()
  mipyme?: boolean;
}

export class UpdateProcesoDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  objeto?: string;

  @IsOptional()
  @IsInt()
  entidadId?: number;

  @IsOptional()
  @IsInt()
  estadoId?: number;

  @IsOptional()
  @IsInt()
  tipoProcesoId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  codigoLink?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  anticipo?: number;

  @IsOptional()
  @IsBoolean()
  mipyme?: boolean;
}
