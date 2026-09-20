import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order_audits')
export class OrderAudit {
  @PrimaryGeneratedColumn() id: number;
  @Column() orderId: number;
  @Column() staffId: number;
  @Column({ length: 50 }) action: string;
  @Column({ length: 50 }) fromStatus: string;
  @Column({ length: 50 }) toStatus: string;
  @Column({ type: 'text', nullable: true }) detail: string;
  @CreateDateColumn() createdAt: Date;
}
