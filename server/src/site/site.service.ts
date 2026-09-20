import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HomeLayoutDto } from './site.dto';
import { SiteSetting } from './site-setting.entity';
import { Category } from '../category/entities/category.entity';

export const DEFAULT_HOME_LAYOUT: HomeLayoutDto = {
  shareTitle: '酷礼工坊｜企业礼品一站式选品',
  notice: '支持企业福利、客户答谢和活动礼赠，可按需求提交询价',
  heroImage: '/static/banners/home-hero.jpg',
  quickEntries: [
    { name: '食品礼盒', categoryId: 2, image: '/static/products/zk-03.jpg' },
    { name: '生鲜滋补', categoryId: 3, image: '/static/products/zk-08.jpg' },
    { name: '家居家纺', categoryId: 4, image: '/static/products/zk-07.jpg' },
    { name: '厨具餐具', categoryId: 5, image: '/static/products/zk-05.jpg' },
    { name: '商务箱包', categoryId: 6, image: '/static/products/zk-06.jpg' },
    { name: '数码小电', categoryId: 7, image: '/static/products/zk-01.jpg' },
    { name: '保温杯', categoryId: 8, image: '/static/products/zk-09.jpg' },
    { name: '运动户外', categoryId: 9, image: '/static/products/zk-02.jpg' },
  ],
  scenes: [
    { title: '员工福利', desc: '日常关怀与节日福利', categoryId: 2, theme: 'festival' },
    { title: '健康关怀', desc: '营养滋补与健康礼赠', categoryId: 3, theme: 'summer' },
    { title: '居家好礼', desc: '家居家纺实用精选', categoryId: 4, theme: 'father' },
    { title: '商务馈赠', desc: '会议活动与客户答谢', categoryId: 6, theme: 'deal' },
    { title: '数码精选', desc: '办公与生活小电', categoryId: 7, theme: 'discount' },
    { title: '户外团建', desc: '运动户外与团队活动', categoryId: 9, theme: 'graduate' },
  ],
};

@Injectable()
export class SiteService {
  constructor(@InjectRepository(SiteSetting) private repo: Repository<SiteSetting>, @InjectRepository(Category) private categories: Repository<Category>) {}

  async publishedHome(): Promise<HomeLayoutDto> {
    const row = await this.repo.findOneBy({ key: 'home' });
    return row ? JSON.parse(row.publishedJson) : DEFAULT_HOME_LAYOUT;
  }

  async adminHome() {
    const row = await this.repo.findOneBy({ key: 'home' });
    if (!row) return { draft: DEFAULT_HOME_LAYOUT, published: DEFAULT_HOME_LAYOUT, version: 0, updatedAt: null };
    return { draft: JSON.parse(row.draftJson), published: JSON.parse(row.publishedJson), version: row.version, updatedAt: row.updatedAt };
  }

  async saveDraft(value: HomeLayoutDto) {
    const ids = [...new Set([...value.quickEntries, ...value.scenes].map(item => item.categoryId))];
    const active = ids.length ? await this.categories.countBy({ id: In(ids), isActive: true }) : 0;
    if (active !== ids.length) throw new BadRequestException('首页入口只能选择已启用的分类');
    const row = await this.repo.findOneBy({ key: 'home' });
    const json = JSON.stringify(value);
    await this.repo.save(row ? { ...row, draftJson: json } : this.repo.create({ key: 'home', draftJson: json, publishedJson: JSON.stringify(DEFAULT_HOME_LAYOUT), version: 1 }));
    return { ok: true };
  }

  async publish() {
    const row = await this.repo.findOneBy({ key: 'home' });
    if (!row) {
      const json = JSON.stringify(DEFAULT_HOME_LAYOUT);
      await this.repo.save(this.repo.create({ key: 'home', draftJson: json, publishedJson: json, version: 1 }));
      return { ok: true, version: 1 };
    }
    row.publishedJson = row.draftJson;
    row.version += 1;
    await this.repo.save(row);
    return { ok: true, version: row.version };
  }

  async restorePublished() {
    const row = await this.repo.findOneBy({ key: 'home' });
    if (row) { row.draftJson = row.publishedJson; await this.repo.save(row); }
    return { ok: true };
  }
}
