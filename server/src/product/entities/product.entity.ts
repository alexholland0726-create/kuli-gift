import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../category/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ length: 500, nullable: true })
  coverImage: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: 0 })
  sales: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isRecommended: boolean;

  @Column({ type: 'simple-json', nullable: true })
  specs: { name: string; values: string[] }[];

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @ManyToOne(() => Category, category => category.products, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ type: 'text', nullable: true })
  shareTitle: string;

  @Column({ type: 'text', nullable: true })
  shareDesc: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
