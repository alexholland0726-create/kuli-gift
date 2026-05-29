import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  type: string; // discount(折扣券) | full_reduce(满减券) | random(随机金额) | exchange(商品兑换)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number; // 折扣金额或折扣率

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAmount: number; // 满减门槛

  @Column({ default: 0 })
  totalStock: number;

  @Column({ default: 0 })
  usedStock: number;

  @Column({ type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 50, default: 'public' })
  scope: string; // public | newbie(新人专享) | member(会员专享) | fan(粉丝专享)

  @Column({ type: 'simple-json', nullable: true })
  applicableProducts: number[]; // 适用的商品ID，空=全部商品

  @Column({ default: 1 })
  perUserLimit: number; // 每人限领

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
