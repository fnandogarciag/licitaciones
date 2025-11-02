import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEstadoProcesoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  nombre!: string;
}

export class UpdateEstadoProcesoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;
}
