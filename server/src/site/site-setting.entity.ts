import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_settings')
export class SiteSetting {
  @PrimaryColumn({ length: 64 })
  key: string;

  @Column({ type: 'longtext' })
  draftJson: string;

  @Column({ type: 'longtext' })
  publishedJson: string;

  @Column({ default: 1 })
  version: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
