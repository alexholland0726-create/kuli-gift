import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  orderNo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'simple-json' })
  items: { productId: number; name: string; coverImage: string; price: number; quantity: number; spec: string }[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  payAmount: number;

  @Column({ length: 50, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ length: 500, nullable: true })
  remark: string;

  @Column({ length: 200, nullable: true })
  consignee: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  shippedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
