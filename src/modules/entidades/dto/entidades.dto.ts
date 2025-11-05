import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEntidadDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  nombre!: string;
}

export class UpdateEntidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;
}
