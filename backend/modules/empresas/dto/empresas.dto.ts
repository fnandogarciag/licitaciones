import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  nombre!: string;
}

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;
}
