import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Oferta } from './oferta.entity';
import { ConsorcioEmpresa } from './consorcio_empresa.entity';

@Entity({ name: 'consorcios' })
export class Consorcio {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => Oferta, (o) => o.consorcio)
  ofertas!: Oferta[];

  @OneToMany(() => ConsorcioEmpresa, (c) => c.consorcio)
  empresas!: ConsorcioEmpresa[];
}
