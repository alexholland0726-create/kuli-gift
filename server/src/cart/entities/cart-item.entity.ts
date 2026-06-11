import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @Column({ length: 100, nullable: true })
  spec: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: false })
  selected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
