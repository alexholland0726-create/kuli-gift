<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { api } from '@/api/index';
import { demoCategories, demoProducts, demoQuickEntries } from '@/api/mock';

interface Category {
  id: number;
  name: string;
  icon: string;
  parentId?: number | null;
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

const rootCategories = (items: Category[]) => items.filter((item) => item.parentId == null);
const categories = ref<Category[]>(rootCategories(demoCategories).slice(0, 10));
const featuredProducts = ref<Product[]>(demoProducts);
const announcementVisible = ref(true);
const isDemoMode = ref(true);

const heroImg = '/static/banners/home-hero.jpg';

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect fill="%23f6faf5" width="220" height="220"/><circle cx="110" cy="92" r="42" fill="%23d5ecd4"/><rect x="56" y="134" width="108" height="34" rx="17" fill="%239ac58f"/><text x="110" y="198" text-anchor="middle" fill="%23799a71" font-size="20">礼品图</text></svg>';

const scenes = [
  { title: '端午节', desc: '平台推荐', keyword: '端午', theme: 'festival' },
  { title: '夏季专区', desc: '清凉一夏', keyword: '夏季', theme: 'summer' },
  { title: '父亲节', desc: '感恩父亲节', keyword: '父亲节', theme: 'father' },
  { title: '专享特惠', desc: '批量好价', keyword: '特惠', theme: 'deal' },
  { title: '折扣专区', desc: '现货清仓', keyword: '折扣', theme: 'discount' },
  { title: '毕业季', desc: '纪念礼赠', keyword: '毕业', theme: 'graduate' },
];

onMounted(async () => {
  enableShareMenu();

  try {
    const catRes = await api.categories.list();
    const realCategories = Array.isArray(catRes) ? catRes : [];
    if (realCategories.length) {
      categories.value = rootCategories(realCategories).slice(0, 10);
      isDemoMode.value = false;
    }
  } catch (_) {}

  try {
    const prodRes = await api.products.list({ recommended: true, limit: 18 });
    const realProducts = (prodRes as any)?.items || [];
    if (realProducts.length) {
      featuredProducts.value = realProducts;
      isDemoMode.value = false;
    }
  } catch (_) {}
});

function enableShareMenu() {
  (uni as any).showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

onShareAppMessage(() => ({
  title: '酷礼工坊｜企业礼品一站式选品',
  path: '/pages/index/index',
}));

onShareTimeline(() => ({
  title: '酷礼工坊｜企业礼品一站式选品',
  query: '',
}));

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' });
}

function goLibrary(keyword?: string) {
  if (keyword) {
    uni.navigateTo({ url: `/pages/product/list?keyword=${encodeURIComponent(keyword)}` });
    return;
  }
  uni.switchTab({ url: '/pages/library/library' });
}

function goCategory(id: number) {
  uni.navigateTo({ url: `/pages/product/list?categoryId=${id}` });
}

function goAllCategories() {
  uni.switchTab({ url: '/pages/category/category' });
}

function goProductDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}

function closeAnnouncement() {
  announcementVisible.value = false;
}

function priceLabel(price: number | string) {
  const value = Number(price || 0);
  return value > 0 ? `￥${value.toFixed(2)}` : '询价';
}
</script>

<template>
  <view class="page">
    <view class="hero-shell">
      <view class="about-pill">关于我们</view>
      <view class="search-bar" @tap="goSearch">
        <text class="search-dot"></text>
        <text class="search-text">请搜索你想要的礼品名称、品牌或型号</text>
        <text class="camera-icon">□</text>
      </view>
      <view class="notice-row" v-if="announcementVisible">
        <text class="notice-icon">!</text>
        <text class="notice-text">夏季/节庆专区已上线，可从产品池自由选品</text>
        <text class="notice-close" @tap.stop="closeAnnouncement">×</text>
      </view>
      <image class="hero-img" :src="heroImg" mode="aspectFill" />
    </view>

    <view class="quick-panel">
      <view
        class="quick-item"
        v-for="entry in demoQuickEntries"
        :key="entry.name"
        @tap="goLibrary(entry.keyword)"
      >
        <view class="quick-icon">
          <image class="quick-img" :src="entry.image" mode="aspectFill" />
        </view>
        <text class="quick-name">{{ entry.name }}</text>
      </view>
      <view class="quick-dots">
        <text class="dot active"></text>
        <text class="dot"></text>
        <text class="dot"></text>
      </view>
    </view>

    <view class="section product-section">
      <view class="section-head">
        <view>
          <text class="section-title">首页主推产品</text>
          <text class="section-sub">{{ isDemoMode ? '当前为演示商品，上传后自动替换' : '来自产品池的主推商品' }}</text>
        </view>
        <text class="section-more" @tap="goLibrary()">礼品库</text>
      </view>
      <view class="product-grid">
        <view class="product-card" v-for="item in featuredProducts" :key="item.id" @tap="goProductDetail(item.id)">
          <image class="product-img" :src="item.coverImage || productPlaceholder" mode="aspectFill" />
          <view class="product-info">
            <view class="tag-line">
              <text class="tag" v-for="tag in (item.tags || []).slice(0, 2)" :key="tag">{{ tag }}</text>
            </view>
            <text class="product-name">{{ item.name }}</text>
            <view class="price-row">
              <text class="price">{{ priceLabel(item.price) }}</text>
              <text class="add-btn">+</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="scene-grid">
      <view
        class="scene-card"
        :class="`scene-${scene.theme}`"
        v-for="scene in scenes"
        :key="scene.title"
        @tap="goLibrary(scene.keyword)"
      >
        <text class="scene-title">{{ scene.title }}</text>
        <text class="scene-desc">{{ scene.desc }}</text>
        <view class="scene-arrow">→</view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <view>
          <text class="section-title">产品分类</text>
          <text class="section-sub">按品类快速筛选，适合批量上传产品</text>
        </view>
        <text class="section-more" @tap="goAllCategories">全部</text>
      </view>
      <view class="category-grid">
        <view class="category-item" v-for="cat in categories" :key="cat.id" @tap="goCategory(cat.id)">
          <view class="category-icon">{{ cat.name.slice(0, 1) }}</view>
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>


  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: linear-gradient(180deg, #dff4d6 0, #f5f7f2 480rpx, #f6f6f6 100%);
}

.hero-shell {
  padding: 36rpx 28rpx 0;
}

.about-pill {
  display: inline-flex;
  align-items: center;
  height: 56rpx;
  padding: 0 22rpx;
  margin-bottom: 24rpx;
  color: #fffbe7;
  font-size: 28rpx;
  font-weight: 700;
  background: #8fc26f;
  border: 3rpx solid rgba(255, 255, 255, .75);
  border-radius: 18rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  background: rgba(255, 255, 255, .9);
  border-radius: 44rpx;
}

.search-dot {
  width: 30rpx;
  height: 30rpx;
  margin-right: 18rpx;
  border: 4rpx solid #b8b8b8;
  border-radius: 50%;
}

.search-text {
  flex: 1;
  min-width: 0;
  color: #8b8b8b;
  font-size: 28rpx;
}

.camera-icon {
  color: #333;
  font-size: 36rpx;
}

.notice-row {
  display: flex;
  align-items: center;
  height: 74rpx;
}

.notice-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38rpx;
  height: 38rpx;
  margin-right: 18rpx;
  color: #5b9156;
  border: 3rpx solid #5b9156;
  border-radius: 50%;
  font-weight: 700;
}

.notice-text {
  flex: 1;
  color: #56745b;
  font-size: 26rpx;
}

.notice-close {
  padding: 8rpx;
  color: #56745b;
  font-size: 40rpx;
}

.hero-img {
  width: 100%;
  height: 300rpx;
  border-radius: 24rpx;
  box-shadow: 0 10rpx 28rpx rgba(73, 113, 64, .16);
}

.quick-panel {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  margin: 18rpx 28rpx;
  padding: 24rpx 16rpx 42rpx;
  background: #fff;
  border-radius: 24rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20%;
  padding: 12rpx 0;
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  padding: 6rpx;
  color: #4f7d48;
  font-size: 28rpx;
  font-weight: 700;
  background: linear-gradient(180deg, #eef9e7 0%, #ffffff 100%);
  border: 2rpx solid #e3f0d9;
  border-radius: 50%;
  box-shadow: 0 6rpx 16rpx rgba(94, 139, 74, .12);
  box-sizing: border-box;
}

.quick-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #f4f8f1;
}

.quick-name {
  margin-top: 12rpx;
  color: #333;
  font-size: 24rpx;
}

.quick-dots {
  position: absolute;
  right: 0;
  bottom: 16rpx;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 10rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  background: #d7d7d7;
  border-radius: 50%;
}

.dot.active {
  width: 32rpx;
  background: #5a5a5a;
  border-radius: 10rpx;
}

.scene-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin: 0 28rpx 18rpx;
}

.scene-card {
  min-height: 168rpx;
  padding: 26rpx;
  background: #fff;
  border-radius: 22rpx;
  box-sizing: border-box;
}

.scene-title {
  display: block;
  color: #263028;
  font-size: 34rpx;
  font-weight: 750;
}

.scene-desc {
  display: block;
  margin-top: 8rpx;
  color: #7a8778;
  font-size: 24rpx;
}

.scene-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  margin-top: 20rpx;
  color: #5d914c;
  background: #e7f5dc;
  border-radius: 12rpx;
}

.scene-festival { background: #fffdf3; }
.scene-summer { background: #f7fff8; }
.scene-father { background: #fff; }
.scene-deal,
.scene-discount,
.scene-graduate { background: #fff; }

.section {
  margin: 0 28rpx 18rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  color: #263028;
  font-size: 32rpx;
  font-weight: 750;
}

.section-sub {
  display: block;
  margin-top: 8rpx;
  color: #8a9588;
  font-size: 22rpx;
}

.section-more {
  color: #5d914c;
  font-size: 24rpx;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20%;
  padding: 12rpx 0;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  color: #6c9c61;
  background: #f1f8ec;
  border-radius: 18rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.category-name {
  margin-top: 10rpx;
  color: #555;
  font-size: 22rpx;
}

.product-section {
  padding-right: 16rpx;
  padding-left: 16rpx;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.product-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1rpx solid #eef2ea;
  border-radius: 18rpx;
}

.product-img {
  width: 100%;
  height: 210rpx;
  background: #f4f7f1;
}

.product-info {
  padding: 12rpx;
}

.tag-line {
  display: flex;
  gap: 6rpx;
  min-height: 28rpx;
}

.tag {
  padding: 2rpx 6rpx;
  color: #9b783f;
  background: #f8edd6;
  border-radius: 4rpx;
  font-size: 18rpx;
}

.product-name {
  display: -webkit-box;
  height: 68rpx;
  margin-top: 8rpx;
  overflow: hidden;
  color: #333;
  font-size: 23rpx;
  line-height: 34rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.price {
  color: #d35b4b;
  font-size: 24rpx;
  font-weight: 700;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  color: #b48745;
  border: 2rpx solid #d7b77e;
  border-radius: 50%;
  font-size: 30rpx;
}
</style>
