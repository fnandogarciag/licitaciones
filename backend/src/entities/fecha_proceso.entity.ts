import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Proceso } from './proceso.entity';
import { TipoFechaProceso } from './tipo_fecha_proceso.entity';

@Entity({ name: 'fecha_proceso' })
export class FechaProceso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Proceso, (p) => p.fechas, { nullable: true })
  @JoinColumn({ name: 'proceso_id' })
  proceso!: Proceso;

  @ManyToOne(() => TipoFechaProceso, (t) => t.fechas, { nullable: true })
  @JoinColumn({ name: 'tipo_fecha_proceso_id' })
  tipoFechaProceso!: TipoFechaProceso;

  @Column({ nullable: true })
  fecha!: Date;

  @Column({ type: 'boolean', name: 'importante', default: false })
  importante!: boolean;
}
