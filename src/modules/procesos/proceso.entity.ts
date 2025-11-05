import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Entidad } from '../entidades/entidad.entity';
import { EstadoProceso } from '../estado_proceso/estado_proceso.entity';
import { TipoProceso } from '../tipo_proceso/tipo_proceso.entity';
import { FechaProceso } from '../fecha_proceso/fecha_proceso.entity';
import { Lote } from '../lotes/lote.entity';

@Entity({ name: 'procesos' })
export class Proceso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'text', nullable: true })
  objeto!: string;

  @ManyToOne(() => Entidad, (entidad) => entidad.procesos, { nullable: true })
  @JoinColumn({ name: 'entidad_id' })
  entidad!: Entidad;

  @Column({ type: 'smallint', nullable: true })
  anticipo!: number;

  @Column({ type: 'boolean', nullable: true })
  mipyme!: boolean;

  @ManyToOne(() => EstadoProceso, (e) => e.procesos, { nullable: true })
  @JoinColumn({ name: 'estado_id' })
  estado!: EstadoProceso;

  @ManyToOne(() => TipoProceso, (t) => t.procesos, { nullable: true })
  @JoinColumn({ name: 'tipo_proceso_id' })
  tipoProceso!: TipoProceso;

  @Column({ name: 'codigo_link', type: 'varchar', nullable: true })
  codigoLink!: string;

  @OneToMany(() => FechaProceso, (f) => f.proceso)
  fechas!: FechaProceso[];

  @OneToMany(() => Lote, (l) => l.proceso)
  lotes!: Lote[];
}
