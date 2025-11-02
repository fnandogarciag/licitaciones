import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Proceso } from './proceso.entity';
import { Oferta } from './oferta.entity';

const decimalToNumber = {
  to: (value?: number | null) =>
    value === null || value === undefined ? null : value,
  from: (value?: string | null) =>
    value === null || value === undefined ? null : parseFloat(value),
};

@Entity({ name: 'lotes' })
export class Lote {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Proceso, (p) => p.lotes, { nullable: true })
  @JoinColumn({ name: 'proceso_id' })
  proceso!: Proceso;

  @Column({
    type: 'decimal',
    precision: 17,
    scale: 2,
    nullable: true,
    transformer: decimalToNumber,
  })
  valor!: number | null;

  @Column({
    type: 'decimal',
    precision: 17,
    scale: 2,
    nullable: true,
    transformer: decimalToNumber,
  })
  poliza!: number | null;

  @Column({ type: 'boolean', nullable: true })
  poliza_real!: boolean;

  @OneToMany(() => Oferta, (o) => o.lote)
  ofertas!: Oferta[];
}
