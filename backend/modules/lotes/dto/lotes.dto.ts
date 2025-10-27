import {
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumberString,
  MaxLength,
} from 'class-validator';

export class CreateLoteDto {
  @IsOptional()
  @IsInt()
  procesoId?: number;

  @IsOptional()
  @IsNumberString()
  @MaxLength(32)
  valor?: string;

  @IsOptional()
  @IsNumberString()
  @MaxLength(32)
  poliza?: string;

  @IsOptional()
  @IsBoolean()
  poliza_real?: boolean;
}

export class UpdateLoteDto {
  @IsOptional()
  @IsInt()
  procesoId?: number;

  @IsOptional()
  @IsNumberString()
  @MaxLength(32)
  valor?: string;

  @IsOptional()
  @IsNumberString()
  @MaxLength(32)
  poliza?: string;

  @IsOptional()
  @IsBoolean()
  poliza_real?: boolean;
}
