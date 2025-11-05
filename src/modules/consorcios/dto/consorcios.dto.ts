import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateConsorcioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  nombre!: string;
}

export class UpdateConsorcioDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;
}
