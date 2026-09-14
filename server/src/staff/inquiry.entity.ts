import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('product_inquiries')
export class ProductInquiry {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 80 }) name: string;
  @Column({ length: 100 }) contact: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'simple-json' }) products: { id: number; name: string; quantity: number }[];
  @Column({ length: 16, default: 'new' }) status: string;
  @CreateDateColumn() createdAt: Date;
}
