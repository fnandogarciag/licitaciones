import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Proceso } from '../procesos/proceso.entity';

@Entity({ name: 'estado_proceso' })
export class EstadoProceso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => Proceso, (p) => p.estado)
  procesos!: Proceso[];
}
