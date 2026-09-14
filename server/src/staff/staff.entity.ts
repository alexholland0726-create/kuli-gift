import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('staff_accounts')
export class StaffAccount {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 64, unique: true }) username: string;
  @Column({ length: 80 }) name: string;
  @Column({ length: 256, select: false }) passwordHash: string;
  @Column({ length: 16, default: 'editor' }) role: 'owner' | 'editor';
  @Column({ default: true }) active: boolean;
  @Column({ default: 1 }) sessionVersion: number;
  @CreateDateColumn() createdAt: Date;
}
