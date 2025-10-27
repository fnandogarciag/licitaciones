import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Consorcio } from './consorcio.entity';
import { Empresa } from './empresa.entity';

@Entity({ name: 'consorcio_empresa' })
export class ConsorcioEmpresa {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Consorcio, (c) => c.empresas, { nullable: true })
  @JoinColumn({ name: 'consorcio_id' })
  consorcio!: Consorcio;

  @ManyToOne(() => Empresa, (e) => e.consorcios, { nullable: true })
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;
}
