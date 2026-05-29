import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrouponActivity } from './groupon-activity.entity';

@Entity('groupon_orders')
export class GrouponOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activityId: number;

  @ManyToOne(() => GrouponActivity)
  @JoinColumn({ name: 'activityId' })
  activity: GrouponActivity;

  @Column({ nullable: true })
  groupId: number; // 开团团ID，首单记录自己的id

  @Column()
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  payAmount: number;

  @Column({ length: 20, default: 'paying' })
  status: string; // paying | paid | success(已成团) | refunded | timeout

  @Column({ nullable: true })
  orderId: number; // 关联商城订单

  @Column({ default: false })
  isLeader: boolean; // 是否是团长

  @CreateDateColumn()
  createdAt: Date;
}
