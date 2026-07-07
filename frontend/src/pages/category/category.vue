<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { api } from '@/api/index';
import { demoCategories, demoProducts } from '@/api/mock';

interface Category {
  id: number;
  name: string;
  icon: string;
  parentId?: number | null;
  children?: Category[];
}

interface SourceLink {
  title: string;
  url: string;
  note?: string;
}

interface ProductMaterial {
  brand: Category;
  productCount: number;
  materials: SourceLink[];
}

const BRAND_MATERIALS: Record<string, SourceLink[]> = {
  '3M': [
    {
      title: '3M 个人安全防护产品目录 2025',
      url: 'https://api.da-fire.com/uploads/materials/3m-personal-safety-catalog-2025.pdf',
      note: '原始产品资料',
    },
  ],
  '霍尼韦尔': [
    {
      title: '霍尼韦尔 PPE 综合样本',
      url: 'https://api.da-fire.com/uploads/materials/honeywell-ppe-catalog.pdf',
      note: '原始产品资料',
    },
  ],
  'MSA': [
    {
      title: 'MSA 梅思安综合样本 Rev2024 CN',
      url: 'https://api.da-fire.com/uploads/materials/msa-general-catalog-rev2024-cn.pdf',
      note: '原始产品资料',
    },
  ],
};

const categories = ref<Category[]>(demoCategories);
const activeIndex = ref(0);
const loading = ref(false);
const brandMaterialMap = ref<Record<number, ProductMaterial>>({});

const displayCategories = computed(() => categories.value.filter((item) => item.parentId == null));

const currentCategory = computed(() => displayCategories.value[activeIndex.value]);

const childCategories = computed(() => {
  const current = currentCategory.value;
  if (!current) return [];
  if (Array.isArray(current.children) && current.children.length) return current.children;
  return categories.value.filter((item) => item.parentId === current.id);
});

const currentProducts = computed(() => {
  const current = currentCategory.value;
  if (!current) return [];
  const ids = [current.id, ...childCategories.value.map((item) => item.id)];
  return demoProducts.filter((item) => ids.includes(item.categoryId));
});

const displayProducts = computed(() => {
  if (!childCategories.value.length) return currentProducts.value;
  return currentProducts.value.slice(0, 6);
});

function uniquePdfMaterials(products: any[]): SourceLink[] {
  const seen = new Set<string>();
  return products
    .flatMap((product) => product.sourceLinks || [])
    .filter((source: SourceLink) => {
      if (!source?.url || !source.url.toLowerCase().includes('.pdf')) return false;
      const key = source.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mergeMaterials(...groups: SourceLink[][]): SourceLink[] {
  const seen = new Set<string>();
  return groups.flat().filter((source) => {
    if (!source?.url) return false;
    const key = source.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

onMounted(async () => {
  try {
    const res = await api.categories.list();
    const realCategories = Array.isArray(res) ? res : [];
    if (realCategories.length) categories.value = realCategories;
  } catch (_) {}
  loadBrandMaterials();
});

function selectCategory(index: number) {
  activeIndex.value = index;
  loadBrandMaterials();
}

function goProductList(categoryId?: number) {
  if (categoryId) {
    uni.navigateTo({ url: `/pages/product/list?categoryId=${categoryId}` });
    return;
  }
  uni.navigateTo({ url: '/pages/product/list' });
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' });
}

async function loadBrandMaterials() {
  const brands = childCategories.value;
  if (!brands.length) {
    brandMaterialMap.value = {};
    return;
  }

  const next: Record<number, ProductMaterial> = {};
  await Promise.all(brands.map(async (brand) => {
    let products: any[] = demoProducts.filter((item) => item.categoryId === brand.id);
    try {
      const res = await api.products.list({ categoryId: brand.id, limit: 50 }) as any;
      if (Array.isArray(res?.items)) products = res.items;
    } catch (_) {}

    const materials = mergeMaterials(
      uniquePdfMaterials(products),
      BRAND_MATERIALS[brand.name] || [],
    );

    next[brand.id] = {
      brand,
      productCount: products.length,
      materials,
    };
  }));

  brandMaterialMap.value = next;
}

function previewMaterial(source: SourceLink) {
  if (!source?.url) return;
  uni.downloadFile({
    url: source.url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          fileType: 'pdf',
          showMenu: true,
        });
        return;
      }
      uni.showToast({ title: '资料预览失败', icon: 'none' });
    },
    fail: () => uni.showToast({ title: '资料预览失败', icon: 'none' }),
  });
}

function downloadMaterial(source: SourceLink) {
  if (!source?.url) return;
  uni.downloadFile({
    url: source.url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: () => uni.showToast({ title: '资料已保存', icon: 'success' }),
          fail: () => {
            uni.openDocument({
              filePath: res.tempFilePath,
              fileType: 'pdf',
              showMenu: true,
            });
          },
        });
        return;
      }
      uni.showToast({ title: '资料下载失败', icon: 'none' });
    },
    fail: () => uni.showToast({ title: '资料下载失败', icon: 'none' }),
  });
}
</script>

<template>
  <view class="page">
    <view class="search-shell" @tap="goSearch">
      <text class="search-icon"></text>
      <text class="search-text">请搜索你想要的礼品品类、品牌或型号</text>
    </view>

    <view class="content">
      <scroll-view class="left-nav" scroll-y>
        <view
          class="nav-item"
          :class="{ active: activeIndex === i }"
          v-for="(cat, i) in displayCategories"
          :key="cat.id"
          @tap="selectCategory(i)"
        >
          <text class="nav-text">{{ cat.name }}</text>
        </view>
      </scroll-view>

      <scroll-view class="right-panel" scroll-y>
        <view class="panel-head">
          <text class="panel-title">{{ currentCategory?.name || '全部分类' }}</text>
          <text class="panel-action" @tap="goProductList(currentCategory?.id)">查看商品</text>
        </view>

        <view class="sub-grid">
          <view
            class="sub-item"
            v-for="item in childCategories"
            :key="`category-${item.id}`"
            @tap="goProductList(item.id)"
          >
            <view class="brand-category-icon">{{ item.name.slice(0, 1) }}</view>
            <text class="sub-name">{{ item.name }}</text>
          </view>
          <view
            class="sub-item"
            v-for="item in displayProducts"
            :key="`product-${item.id}`"
            @tap="goProductList(item.categoryId)"
          >
            <image
              class="sub-img"
              :src="item.coverImage || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22 viewBox=%220 0 160 160%22><rect width=%22160%22 height=%22160%22 rx=%2220%22 fill=%22%23f7faf4%22/><circle cx=%2280%22 cy=%2268%22 r=%2232%22 fill=%22%23d7ebcf%22/><rect x=%2242%22 y=%22108%22 width=%2276%22 height=%2224%22 rx=%2212%22 fill=%22%2393bf82%22/></svg>'"
              mode="aspectFill"
            />
            <text class="sub-name">{{ item.name.replace('礼盒', '').slice(0, 8) }}</text>
          </view>
          <view class="sub-item empty-sub" v-if="!childCategories.length && !displayProducts.length">
            <text class="empty-text">暂无商品</text>
          </view>
        </view>

        <view class="material-panel" v-if="childCategories.length">
          <view class="material-head">
            <text class="material-title">产品资料</text>
            <text class="material-subtitle">PDF 预览 / 下载</text>
          </view>
          <view
            class="material-card"
            v-for="brand in childCategories"
            :key="`material-${brand.id}`"
          >
            <view class="material-brand-row">
              <view class="material-brand-icon">{{ brand.name.slice(0, 1) }}</view>
              <view class="material-brand-info">
                <text class="material-brand-name">{{ brand.name }}</text>
                <text class="material-brand-meta">
                  {{ brandMaterialMap[brand.id]?.productCount || 0 }} 个产品 · {{ brandMaterialMap[brand.id]?.materials?.length || 0 }} 份资料
                </text>
              </view>
              <text class="material-brand-action" @tap="goProductList(brand.id)">看产品</text>
            </view>

            <view class="material-list" v-if="brandMaterialMap[brand.id]?.materials?.length">
              <view
                class="material-row"
                v-for="source in brandMaterialMap[brand.id].materials"
                :key="source.url"
              >
                <view class="material-file">
                  <text class="material-file-icon">PDF</text>
                  <view class="material-file-copy">
                    <text class="material-file-title">{{ source.title }}</text>
                    <text class="material-file-note">{{ source.note || '原始产品资料' }}</text>
                  </view>
                </view>
                <view class="material-actions">
                  <text class="material-btn" @tap="previewMaterial(source)">预览</text>
                  <text class="material-btn primary" @tap="downloadMaterial(source)">下载</text>
                </view>
              </view>
            </view>
            <view class="material-empty" v-else>
              <text>暂无 PDF，上传原始资料后会显示在这里。</text>
            </view>
          </view>
        </view>

        <view class="tips-card">
          <text class="tips-title">分类上传建议</text>
          <text class="tips-desc">礼品产品结构可以保持简单：先建大类，再把产品放入产品池；首页主推从产品池中勾选即可。</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7f5;
}

.search-shell {
  display: flex;
  align-items: center;
  height: 72rpx;
  margin: 18rpx 20rpx;
  padding: 0 24rpx;
  background: #fff;
  border-radius: 36rpx;
}

.search-icon {
  width: 26rpx;
  height: 26rpx;
  margin-right: 16rpx;
  border: 4rpx solid #b6b6b6;
  border-radius: 50%;
}

.search-text {
  color: #9a9a9a;
  font-size: 25rpx;
}

.content {
  display: flex;
  height: calc(100vh - 108rpx);
}

.left-nav {
  width: 172rpx;
  background: #eef3ec;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 86rpx;
  padding: 10rpx 12rpx;
  box-sizing: border-box;
}

.nav-item.active {
  position: relative;
  background: #fff;
}

.nav-item.active::before {
  position: absolute;
  top: 22rpx;
  bottom: 22rpx;
  left: 0;
  width: 6rpx;
  content: '';
  background: #7aac5b;
  border-radius: 6rpx;
}

.nav-text {
  color: #616b5e;
  font-size: 24rpx;
  text-align: center;
}

.nav-item.active .nav-text {
  color: #4d823d;
  font-weight: 700;
}

.right-panel {
  flex: 1;
  padding: 0 18rpx 120rpx;
  box-sizing: border-box;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0 20rpx;
}

.panel-title {
  color: #273027;
  font-size: 30rpx;
  font-weight: 750;
}

.panel-action {
  color: #6fa458;
  font-size: 23rpx;
}

.sub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx 14rpx;
  padding: 20rpx 10rpx;
  background: #fff;
  border-radius: 18rpx;
}

.sub-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.sub-img {
  width: 128rpx;
  height: 128rpx;
  background: #f4f7f2;
  border-radius: 18rpx;
}

.brand-category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  color: #2f6235;
  font-size: 34rpx;
  font-weight: 800;
  background: #eaf6e2;
  border: 2rpx solid #c9e2be;
  border-radius: 18rpx;
}

.sub-name {
  width: 100%;
  margin-top: 10rpx;
  overflow: hidden;
  color: #3d453b;
  font-size: 22rpx;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-sub {
  grid-column: 1 / 4;
  min-height: 180rpx;
  justify-content: center;
}

.empty-text {
  color: #aaa;
  font-size: 24rpx;
}

.tips-card {
  margin-top: 18rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 18rpx;
}

.material-panel {
  margin-top: 18rpx;
}

.material-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.material-title {
  color: #273027;
  font-size: 28rpx;
  font-weight: 800;
}

.material-subtitle {
  color: #8a9283;
  font-size: 22rpx;
}

.material-card {
  padding: 20rpx;
  margin-bottom: 14rpx;
  background: #fff;
  border-radius: 18rpx;
}

.material-brand-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.material-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  color: #2f6235;
  font-size: 24rpx;
  font-weight: 800;
  background: #eaf6e2;
  border-radius: 16rpx;
}

.material-brand-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4rpx;
}

.material-brand-name {
  color: #273027;
  font-size: 26rpx;
  font-weight: 800;
}

.material-brand-meta {
  color: #8a9283;
  font-size: 21rpx;
}

.material-brand-action {
  color: #6fa458;
  font-size: 22rpx;
  font-weight: 700;
}

.material-list {
  margin-top: 16rpx;
  border-top: 1rpx solid #edf0e8;
}

.material-row {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #edf0e8;
}

.material-file {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.material-file-icon {
  width: 62rpx;
  height: 42rpx;
  color: #fff;
  font-size: 19rpx;
  font-weight: 800;
  line-height: 42rpx;
  text-align: center;
  background: #d9553f;
  border-radius: 8rpx;
}

.material-file-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4rpx;
}

.material-file-title {
  overflow: hidden;
  color: #333b30;
  font-size: 23rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-file-note {
  color: #8a9283;
  font-size: 20rpx;
}

.material-actions {
  display: flex;
  gap: 12rpx;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.material-btn {
  height: 48rpx;
  padding: 0 18rpx;
  color: #5f6b5b;
  font-size: 22rpx;
  line-height: 48rpx;
  background: #f3f5f1;
  border-radius: 999rpx;
}

.material-btn.primary {
  color: #fff;
  background: #6fa458;
}

.material-empty {
  margin-top: 16rpx;
  padding: 18rpx;
  color: #8a9283;
  font-size: 22rpx;
  line-height: 1.5;
  background: #f8faf5;
  border-radius: 14rpx;
}

.tips-title {
  display: block;
  color: #273027;
  font-size: 28rpx;
  font-weight: 700;
}

.tips-desc {
  display: block;
  margin-top: 10rpx;
  color: #7d897b;
  font-size: 23rpx;
  line-height: 1.7;
}
</style>
