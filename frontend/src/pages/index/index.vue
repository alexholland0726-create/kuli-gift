<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';
import { demoCategories, demoProducts } from '@/api/mock';

interface Banner {
  id: number;
  image: string;
  linkType: string;
  linkValue: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  sales: number;
  tags: string[];
}

const banners = ref<Banner[]>([
  { id: 1, image: '', linkType: 'product', linkValue: '' },
  { id: 2, image: '', linkType: 'category', linkValue: '' },
]);

const categories = ref<Category[]>(demoCategories.slice(0, 8));
const hotProducts = ref<Product[]>(demoProducts.slice(0, 6));
const isDemoMode = ref(true);

const giftScenes = [
  { title: '商务伴手礼', desc: '会议 / 客户拜访', tone: 'amber', keyword: '商务礼品' },
  { title: '员工福利', desc: '节日 / 团队关怀', tone: 'green', keyword: '员工福利' },
  { title: '品牌定制', desc: 'LOGO / 包装方案', tone: 'blue', keyword: '定制' },
  { title: '运动户外', desc: '活动 / 赛事礼赠', tone: 'orange', keyword: '运动' },
];

const servicePoints = [
  '企业批量采购',
  'LOGO 定制',
  '礼盒包装',
  '专人选品',
];

const promoSlots = [
  { title: '新人礼券', desc: '首单满减待配置', action: '去领券' },
  { title: '热销榜单', desc: '按销量自动生成', action: '看榜单' },
];

const placeholderImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="750" height="360" viewBox="0 0 750 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23FFF6EA"/><stop offset="0.55" stop-color="%23EFD0A8"/><stop offset="1" stop-color="%23B8895A"/></linearGradient></defs><rect fill="url(%23g)" width="750" height="360"/><circle cx="620" cy="82" r="70" fill="%23FFFFFF" opacity="0.28"/><circle cx="120" cy="300" r="110" fill="%23FFFFFF" opacity="0.22"/><text x="58" y="126" fill="%236B4B30" font-size="30">企业礼赠解决方案</text><text x="58" y="192" fill="%23382518" font-size="54" font-weight="bold">酷礼工坊</text><text x="58" y="244" fill="%236B4B30" font-size="26">严选好礼 · 定制包装 · 批量交付</text></svg>';

const catPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23F5E6D3"/><text x="50" y="56" text-anchor="middle" fill="%23B8895A" font-size="28">礼</text></svg>';

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="345" height="345" viewBox="0 0 345 345"><rect fill="%23f5f5f5" width="345" height="345"/><text x="172" y="178" text-anchor="middle" fill="%23ccc" font-size="24">暂无图片</text></svg>';

onMounted(async () => {
  try {
    const catRes = await api.categories.list();
    const realCategories = Array.isArray(catRes) ? catRes.slice(0, 8) : [];
    if (realCategories.length) {
      categories.value = realCategories;
      isDemoMode.value = false;
    }
  } catch (_) {
    isDemoMode.value = true;
  }

  try {
    const prodRes = await api.products.list({ recommended: true, limit: 6 });
    const realProducts = (prodRes as any)?.items || [];
    if (realProducts.length) {
      hotProducts.value = fillProductGrid(realProducts);
      isDemoMode.value = false;
    }
  } catch (_) {
    isDemoMode.value = true;
  }
});

function goCategory(id: number) {
  uni.switchTab({ url: '/pages/category/category' });
}

function goProductList(catId?: number) {
  if (catId) {
    uni.navigateTo({ url: `/pages/product/list?categoryId=${catId}` });
  } else {
    uni.switchTab({ url: '/pages/category/category' });
  }
}

function goProductDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}

function onBannerTap(banner: Banner) {
  if (banner.linkType === 'product' && banner.linkValue) {
    uni.navigateTo({ url: `/pages/product/detail?id=${banner.linkValue}` });
  } else if (banner.linkType === 'category' && banner.linkValue) {
    goProductList(Number(banner.linkValue));
  } else {
    goProductList();
  }
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' });
}

function searchKeyword(keyword: string) {
  uni.navigateTo({ url: `/pages/product/list?keyword=${encodeURIComponent(keyword)}` });
}

function fillProductGrid(items: Product[]) {
  const merged = [...items];
  demoProducts.forEach((demo) => {
    if (merged.length >= 4) return;
    if (!merged.some((item) => item.id === demo.id)) {
      merged.push(demo);
    }
  });
  return merged.slice(0, 6);
}
</script>

<template>
  <view class="page">
    <view class="top-shell">
      <view class="brand-row">
        <view>
          <text class="brand-name">酷礼工坊</text>
          <text class="brand-subtitle">企业礼品定制商城</text>
        </view>
        <view class="service-badge">{{ isDemoMode ? '演示模式' : '严选礼赠' }}</view>
      </view>

      <view class="search-bar" @tap="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">搜索礼品、场景、定制服务</text>
      </view>
    </view>

    <swiper
      class="banner-swiper"
      autoplay
      circular
      indicator-dots
      indicator-color="rgba(255,255,255,0.4)"
      indicator-active-color="#D4A574"
      interval="4000"
      duration="500"
    >
      <swiper-item v-for="banner in banners" :key="banner.id" @tap="onBannerTap(banner)">
        <image :src="banner.image || placeholderImg" class="banner-img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <view class="service-strip">
      <text class="service-item" v-for="item in servicePoints" :key="item">{{ item }}</text>
    </view>

    <view class="section scene-section">
      <view class="section-header">
        <view>
          <text class="section-title">按礼赠场景选</text>
          <text class="section-subtitle">先预留运营入口，后续可接后台配置</text>
        </view>
      </view>
      <view class="scene-grid">
        <view
          class="scene-card"
          :class="`scene-${scene.tone}`"
          v-for="scene in giftScenes"
          :key="scene.title"
          @tap="searchKeyword(scene.keyword)"
        >
          <text class="scene-title">{{ scene.title }}</text>
          <text class="scene-desc">{{ scene.desc }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header compact">
        <view>
          <text class="section-title">商品分类</text>
          <text class="section-subtitle">箱包、服装、鞋帽、运动用品</text>
        </view>
        <text class="section-more" @tap="goProductList()">全部 ></text>
      </view>
      <view class="cat-grid">
        <view
          class="cat-item"
          v-for="cat in categories"
          :key="cat.id"
          @tap="goProductList(cat.id)"
        >
          <image :src="cat.icon || catPlaceholder" class="cat-icon" mode="aspectFill" />
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <view class="promo-row">
      <view class="promo-card" v-for="slot in promoSlots" :key="slot.title" @tap="goProductList()">
        <text class="promo-title">{{ slot.title }}</text>
        <text class="promo-desc">{{ slot.desc }}</text>
        <text class="promo-action">{{ slot.action }} &gt;</text>
      </view>
    </view>

    <view class="section hot-section">
      <view class="section-header">
        <view>
          <text class="section-title">热门推荐</text>
          <text class="section-subtitle">适合企业采购与日常礼赠</text>
        </view>
        <text class="section-more" @tap="goProductList()">查看全部 ></text>
      </view>
      <view class="product-grid">
        <view
          class="product-card"
          v-for="item in hotProducts"
          :key="item.id"
          @tap="goProductDetail(item.id)"
        >
          <view class="product-card-inner">
            <image
              :src="item.coverImage || productPlaceholder"
              class="product-img"
              mode="aspectFill"
            />
            <view class="product-info">
              <text class="product-name ellipsis">{{ item.name }}</text>
              <view class="tag-row" v-if="item.tags && item.tags.length">
                <text class="tag" v-for="t in item.tags.slice(0, 2)" :key="t">{{ t }}</text>
              </view>
              <view class="price-row">
                <text class="price">¥{{ item.price }}</text>
                <text class="original" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
              </view>
              <view class="meta-row">
                <text class="sales" v-if="item.sales > 0">已售 {{ item.sales }}</text>
                <text class="quote-text">支持定制</text>
              </view>
            </view>
          </view>
        </view>
        <view class="empty-card" v-if="!hotProducts.length">
          <text class="empty-text">暂无推荐商品</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  background: #f6f7f8;
  min-height: 100vh;
  padding-bottom: 100rpx;
}

.top-shell {
  background: #fff;
  padding: 22rpx 24rpx 18rpx;
}
.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}
.brand-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #2c241d;
}
.brand-subtitle {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #8a7a6a;
}
.service-badge {
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  background: #f8efe4;
  color: #8d633d;
  font-size: 22rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 72rpx;
  background: #f4f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
}
.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}
.search-placeholder {
  font-size: 26rpx;
  color: #bbb;
}

/* 轮播 */
.banner-swiper {
  width: calc(100% - 48rpx);
  height: 318rpx;
  margin: 20rpx 24rpx 16rpx;
  border-radius: 18rpx;
  overflow: hidden;
}
.banner-img {
  width: 100%;
  height: 318rpx;
}

.section {
  background: #fff;
  margin: 0 24rpx 20rpx;
  padding: 24rpx 0;
  border-radius: 16rpx;
  overflow: hidden;
}
.service-strip {
  display: flex;
  flex-wrap: wrap;
  margin: 0 24rpx 20rpx;
  padding: 18rpx 20rpx;
  background: #fff;
  border-radius: 16rpx;
}
.service-item {
  width: 50%;
  color: #6f6256;
  font-size: 23rpx;
  line-height: 42rpx;
}
.service-item::before {
  content: '';
  display: inline-block;
  width: 10rpx;
  height: 10rpx;
  margin-right: 10rpx;
  border-radius: 50%;
  background: #d4a574;
}
.scene-section {
  padding-bottom: 20rpx;
}
.scene-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 20rpx;
  gap: 14rpx;
}
.scene-card {
  width: calc(50% - 7rpx);
  min-height: 118rpx;
  padding: 22rpx;
  border-radius: 12rpx;
  background: #faf4ec;
  box-sizing: border-box;
}
.scene-title {
  display: block;
  font-size: 28rpx;
  font-weight: 650;
  color: #2d2721;
}
.scene-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #766b60;
}
.scene-amber { background: #fff3df; }
.scene-green { background: #edf7ef; }
.scene-blue { background: #eef5fb; }
.scene-orange { background: #fff0e8; }
.compact {
  padding-bottom: 14rpx;
}
.cat-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 12rpx;
}
.cat-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 0;
}
.cat-icon {
  width: 92rpx;
  height: 92rpx;
  border-radius: 12rpx;
  background: #f7f1ea;
}
.cat-name {
  font-size: 24rpx;
  color: #333;
  margin-top: 10rpx;
}

/* 热门推荐 */
.hot-section {
  padding: 24rpx 0 16rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx 20rpx;
}
.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #2f2924;
}
.section-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9a8d80;
}
.section-more {
  font-size: 24rpx;
  color: #8d633d;
}
.promo-row {
  display: flex;
  gap: 16rpx;
  margin: 0 24rpx 20rpx;
}
.promo-card {
  flex: 1;
  padding: 22rpx;
  background: #fff;
  border-radius: 16rpx;
}
.promo-title {
  display: block;
  color: #2f2924;
  font-size: 28rpx;
  font-weight: 650;
}
.promo-desc {
  display: block;
  margin-top: 8rpx;
  color: #9a8d80;
  font-size: 22rpx;
}
.promo-action {
  display: block;
  margin-top: 18rpx;
  color: #8d633d;
  font-size: 23rpx;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 12rpx;
}
.product-card {
  width: 50%;
  box-sizing: border-box;
  padding: 0 8rpx 16rpx;
  background: transparent;
}
.product-card-inner {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #f0ece7;
}
.product-img {
  width: 100%;
  height: 345rpx;
  background: #f5f5f5;
}
.product-info {
  padding: 16rpx;
}
.product-name {
  font-size: 26rpx;
  color: #2f2924;
  line-height: 1.4;
  display: block;
}
.tag-row {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
}
.tag {
  background: #f7efe6;
  color: #8d633d;
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}
.price-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
}
.price {
  font-size: 30rpx;
  font-weight: 600;
  color: #b9824f;
}
.original {
  font-size: 22rpx;
  color: #ccc;
  text-decoration: line-through;
  margin-left: 10rpx;
}
.meta-row {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sales,
.quote-text {
  font-size: 20rpx;
  color: #999;
}
.quote-text {
  color: #8d633d;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-card {
  width: 100%;
  padding: 80rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 28rpx;
  color: #ccc;
}
</style>
