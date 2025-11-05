import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ConsorcioEmpresa } from '../consorcio_empresa/consorcio_empresa.entity';

@Entity({ name: 'empresas' })
export class Empresa {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => ConsorcioEmpresa, (c) => c.empresa)
  consorcios!: ConsorcioEmpresa[];
}
