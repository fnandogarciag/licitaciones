import { IsOptional, IsInt, IsNotEmpty } from 'class-validator';

export class CreateConsorcioEmpresaDto {
  @IsInt()
  @IsNotEmpty()
  consorcioId!: number;

  @IsInt()
  @IsNotEmpty()
  empresaId!: number;
}

export class UpdateConsorcioEmpresaDto {
  @IsOptional()
  @IsInt()
  consorcioId?: number;

  @IsOptional()
  @IsInt()
  empresaId?: number;
}
