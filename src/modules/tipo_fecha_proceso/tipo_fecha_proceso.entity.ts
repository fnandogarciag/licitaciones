import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FechaProceso } from '../fecha_proceso/fecha_proceso.entity';

@Entity({ name: 'tipo_fecha_proceso' })
export class TipoFechaProceso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  nombre!: string;

  @OneToMany(() => FechaProceso, (f) => f.tipoFechaProceso)
  fechas!: FechaProceso[];
}
