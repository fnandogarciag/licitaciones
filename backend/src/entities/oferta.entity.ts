import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lote } from './lote.entity';
import { Consorcio } from './consorcio.entity';

@Entity({ name: 'ofertas' })
export class Oferta {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Lote, (l) => l.ofertas, { nullable: true })
  @JoinColumn({ name: 'lote_id' })
  lote!: Lote;

  @ManyToOne(() => Consorcio, (c) => c.ofertas, { nullable: true })
  @JoinColumn({ name: 'consorcio_id' })
  consorcio!: Consorcio;
}
