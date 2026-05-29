import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('groupon_activities')
export class GrouponActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  groupPrice: number;

  @Column({ default: 2 })
  targetNum: number; // 成团人数

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ default: 0 })
  maxLimit: number; // 最大成团次数（0=不限）

  @Column({ default: 0 })
  currentGroups: number;

  @Column({ length: 20, default: 'active' })
  status: string; // active | finished | cancelled

  @Column({ length: 20, default: 'normal' })
  type: string; // normal(普通拼团) | newbie(老带新) | ladder(阶梯拼团) | multi(多商品)

  @Column({ type: 'simple-json', nullable: true })
  ladderPrices: { target: number; price: number }[]; // 阶梯价

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
