import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  icon: string;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
