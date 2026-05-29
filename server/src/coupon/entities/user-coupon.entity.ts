import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Coupon } from './coupon.entity';
import { User } from '../../user/entities/user.entity';

@Entity('user_coupons')
export class UserCoupon {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column()
  couponId: number;

  @Column({ length: 20, default: 'unused' })
  status: string; // unused | used | expired

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date;

  @Column({ nullable: true })
  orderId: number;

  @CreateDateColumn()
  gotAt: Date;
}
