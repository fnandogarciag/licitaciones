import { IsOptional, IsInt, IsNotEmpty } from 'class-validator';

export class CreateOfertaDto {
  @IsInt()
  @IsNotEmpty()
  loteId!: number;

  @IsInt()
  @IsNotEmpty()
  consorcioId!: number;
}

export class UpdateOfertaDto {
  @IsOptional()
  @IsInt()
  loteId?: number;

  @IsOptional()
  @IsInt()
  consorcioId?: number;
}
