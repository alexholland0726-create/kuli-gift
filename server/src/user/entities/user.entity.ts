import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true, nullable: true })
  openid: string;

  @Column({ length: 100, nullable: true })
  nickname: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ default: 0 })
  points: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  shareHistory: { productId: number; sharedAt: Date }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
