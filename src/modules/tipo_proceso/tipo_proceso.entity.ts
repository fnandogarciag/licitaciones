import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Proceso } from '../procesos/proceso.entity';

@Entity({ name: 'tipo_proceso' })
export class TipoProceso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => Proceso, (p: Proceso) => p.tipoProceso)
  procesos!: Proceso[];
}
