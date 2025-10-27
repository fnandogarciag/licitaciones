import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTipoProcesoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  nombre!: string;
}

export class UpdateTipoProcesoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;
}
