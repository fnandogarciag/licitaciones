import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Proceso } from './proceso.entity';

@Entity({ name: 'tipo_proceso' })
export class TipoProceso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => Proceso, (p) => p.tipoProceso)
  procesos!: Proceso[];
}
