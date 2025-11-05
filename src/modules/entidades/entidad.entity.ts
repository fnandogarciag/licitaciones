import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Proceso } from '../procesos/proceso.entity';

@Entity({ name: 'entidades' })
export class Entidad {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => Proceso, (proceso) => proceso.entidad)
  procesos!: Proceso[];
}
