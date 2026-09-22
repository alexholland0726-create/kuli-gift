<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { api } from '@/api/index';

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
const categories = ref<Category[]>([]);
const featuredProducts = ref<Product[]>([]);
const announcementVisible = ref(true);
const homeLoading = ref(true);
const homeError = ref(false);

const shareTitle = ref('酷礼工坊｜企业礼品一站式选品');
const notice = ref('支持企业福利、客户答谢和活动礼赠，可按需求提交询价');
const heroImg = ref('/static/banners/home-hero.jpg');

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect fill="%23f6faf5" width="220" height="220"/><circle cx="110" cy="92" r="42" fill="%23d5ecd4"/><rect x="56" y="134" width="108" height="34" rx="17" fill="%239ac58f"/><text x="110" y="198" text-anchor="middle" fill="%23799a71" font-size="20">礼品图</text></svg>';

const quickEntries = ref([
  { name: '食品礼盒', categoryId: 2, image: '/static/products/zk-03.jpg' },
  { name: '生鲜滋补', categoryId: 3, image: '/static/products/zk-08.jpg' },
  { name: '家居家纺', categoryId: 4, image: '/static/products/zk-07.jpg' },
  { name: '厨具餐具', categoryId: 5, image: '/static/products/zk-05.jpg' },
  { name: '商务箱包', categoryId: 6, image: '/static/products/zk-06.jpg' },
  { name: '数码小电', categoryId: 7, image: '/static/products/zk-01.jpg' },
  { name: '保温杯', categoryId: 8, image: '/static/products/zk-09.jpg' },
  { name: '运动户外', categoryId: 9, image: '/static/products/zk-02.jpg' },
]);

const scenes = ref([
  { title: '员工福利', desc: '日常关怀与节日福利', categoryId: 2, theme: 'festival' },
  { title: '健康关怀', desc: '营养滋补与健康礼赠', categoryId: 3, theme: 'summer' },
  { title: '居家好礼', desc: '家居家纺实用精选', categoryId: 4, theme: 'father' },
  { title: '商务馈赠', desc: '会议活动与客户答谢', categoryId: 6, theme: 'deal' },
  { title: '数码精选', desc: '办公与生活小电', categoryId: 7, theme: 'discount' },
  { title: '户外团建', desc: '运动户外与团队活动', categoryId: 9, theme: 'graduate' },
]);

async function loadHome() {
  homeLoading.value = true;
  homeError.value = false;
  let failed = false;
  try {
    const layout = await api.site.home();
    if (layout?.shareTitle) shareTitle.value = layout.shareTitle;
    if (layout?.notice) notice.value = layout.notice;
    if (layout?.heroImage) heroImg.value = layout.heroImage;
    if (Array.isArray(layout?.quickEntries) && layout.quickEntries.length) quickEntries.value = layout.quickEntries;
    if (Array.isArray(layout?.scenes) && layout.scenes.length) scenes.value = layout.scenes;
  } catch (_) { failed = true; }

  try {
    const catRes = await api.categories.list();
    const realCategories = Array.isArray(catRes) ? catRes : [];
    if (realCategories.length) {
      categories.value = rootCategories(realCategories).slice(0, 10);
    }
  } catch (_) { failed = true; }

  try {
    const prodRes = await api.products.list({ recommended: true, limit: 18 });
    const realProducts = (prodRes as any)?.items || [];
    if (realProducts.length) {
      featuredProducts.value = realProducts;
    }
  } catch (_) { failed = true; }
  finally { homeError.value = failed; homeLoading.value = false; }
}

onMounted(() => {
  enableShareMenu();
  loadHome();
});

function enableShareMenu() {
  (uni as any).showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

onShareAppMessage(() => ({
  title: shareTitle.value,
  path: '/pages/index/index',
}));

onShareTimeline(() => ({
  title: shareTitle.value,
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
      <view class="brand-head">
        <text class="brand-eyebrow">KULI GIFT · 企业礼赠</text>
        <text class="brand-title">把每一份心意，送得更体面</text>
        <text class="brand-subtitle">按预算、场景和人群快速选品</text>
      </view>
      <view class="search-bar" hover-class="pressable" @tap="goSearch">
        <text class="search-dot"></text>
        <text class="search-text">请搜索你想要的礼品名称、品牌或型号</text>
        <text class="search-action">搜索</text>
      </view>
      <view class="notice-row" v-if="announcementVisible">
        <text class="notice-icon">!</text>
        <text class="notice-text">{{ notice }}</text>
        <text class="notice-close" @tap.stop="closeAnnouncement">×</text>
      </view>
      <image class="hero-img" :src="heroImg" mode="aspectFill" />
    </view>

    <view class="home-alert" v-if="homeError">
      <view><text class="alert-title">部分内容暂时没有更新</text><text class="alert-desc">网络恢复后可重新加载，现有分类仍可继续浏览。</text></view>
      <text class="alert-retry" hover-class="pressable" @tap="loadHome">重新加载</text>
    </view>

    <view class="quick-panel">
      <view
        class="quick-item"
        hover-class="pressable"
        v-for="entry in quickEntries"
        :key="entry.name"
        @tap="goCategory(entry.categoryId)"
      >
        <view class="quick-icon">
          <image class="quick-img" :src="entry.image" mode="aspectFill" />
        </view>
        <text class="quick-name">{{ entry.name }}</text>
      </view>
    </view>

    <view class="section product-section">
      <view class="section-head">
        <view>
          <text class="section-title">首页主推产品</text>
          <text class="section-sub">来自产品池的主推商品</text>
        </view>
        <text class="section-more" hover-class="pressable" @tap="goLibrary()">查看全部 →</text>
      </view>
      <view class="product-grid skeleton-grid" v-if="homeLoading && !featuredProducts.length">
        <view class="product-card skeleton-card" v-for="i in 4" :key="i"><view class="skeleton-image"></view><view class="skeleton-line wide"></view><view class="skeleton-line"></view></view>
      </view>
      <view class="product-grid">
        <view class="product-card" hover-class="pressable" v-for="item in featuredProducts" :key="item.id" @tap="goProductDetail(item.id)">
          <image class="product-img" :src="item.coverImage || productPlaceholder" mode="aspectFill" />
          <view class="product-info">
            <view class="tag-line">
              <text class="tag" v-for="tag in (item.tags || []).slice(0, 2)" :key="tag">{{ tag }}</text>
            </view>
            <text class="product-name">{{ item.name }}</text>
            <view class="price-row">
              <text class="price">{{ priceLabel(item.price) }}</text>
              <text class="add-btn">查看 →</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="scene-grid">
      <view
        class="scene-card"
        hover-class="pressable"
        :class="`scene-${scene.theme}`"
        v-for="scene in scenes"
        :key="scene.title"
        @tap="goCategory(scene.categoryId)"
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
          <text class="section-sub">按品类快速找到适合的企业礼品</text>
        </view>
        <text class="section-more" hover-class="pressable" @tap="goAllCategories">全部分类 →</text>
      </view>
      <view class="category-grid">
        <view class="category-item" hover-class="pressable" v-for="cat in categories" :key="cat.id" @tap="goCategory(cat.id)">
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

.brand-head {
  display: flex;
  flex-direction: column;
  margin: 6rpx 2rpx 28rpx;
}
.brand-eyebrow { color: #426b4b; font-size: 20rpx; font-weight: 800; letter-spacing: 4rpx; }
.brand-title { margin-top: 12rpx; color: #17311f; font-size: 44rpx; font-weight: 850; letter-spacing: -1rpx; }
.brand-subtitle { margin-top: 10rpx; color: #66796a; font-size: 25rpx; }
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

.search-action { padding: 10rpx 20rpx; color: #fff; background: #315f40; border-radius: 999rpx; font-size: 23rpx; font-weight: 700; }

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
  padding: 24rpx 16rpx;
  background: #fff;
  border-radius: 24rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.product-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1rpx solid #e7eee3;
  border-radius: 22rpx;
  box-shadow: 0 10rpx 28rpx rgba(37, 66, 44, .07);
}

.product-img {
  width: 100%;
  height: 292rpx;
  background: #f4f7f1;
}

.product-info {
  padding: 18rpx;
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
  height: 76rpx;
  margin-top: 8rpx;
  overflow: hidden;
  color: #333;
  font-size: 27rpx;
  font-weight: 650;
  line-height: 38rpx;
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
  font-size: 29rpx;
  font-weight: 700;
}
.home-alert{display:flex;align-items:center;gap:18rpx;margin:18rpx 28rpx;padding:20rpx 22rpx;background:#fff8e9;border:1rpx solid #eed9aa;border-radius:18rpx}.home-alert view{flex:1}.alert-title,.alert-desc{display:block}.alert-title{color:#805f29;font-size:25rpx;font-weight:700}.alert-desc{margin-top:6rpx;color:#987d51;font-size:21rpx}.alert-retry{padding:12rpx 18rpx;color:#fff;background:#8c713f;border-radius:999rpx;font-size:22rpx;white-space:nowrap}
.skeleton-card { pointer-events: none; }
.skeleton-image, .skeleton-line { background: linear-gradient(90deg,#eef1eb 25%,#f8faf6 50%,#eef1eb 75%); background-size: 200% 100%; animation: shimmer 1.25s infinite; }
.skeleton-image { height: 292rpx; }
.skeleton-line { width: 54%; height: 24rpx; margin: 18rpx; border-radius: 12rpx; }
.skeleton-line.wide { width: 76%; margin-bottom: 8rpx; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 86rpx;
  height: 42rpx;
  padding: 0 14rpx;
  color: #b48745;
  border: 2rpx solid #d7b77e;
  border-radius: 999rpx;
  font-size: 22rpx;
}
</style>
