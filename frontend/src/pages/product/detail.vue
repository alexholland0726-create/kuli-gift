<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { api } from '@/api/index';
import { getDemoProduct } from '@/api/mock';

interface Spec {
  name: string;
  values: string[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  coverImage: string;
  stock: number;
  sales: number;
  specs: Spec[];
  tags: string[];
  shareTitle?: string;
  shareDesc?: string;
  categoryId: number;
}

const product = ref<Product | null>(null);
const id = ref(0);
const quantity = ref(1);
const selectedSpecs = ref<Record<string, string>>({});
const showSpecPanel = ref(false);
const cartLoading = ref(false);
const currentImageIndex = ref(0);
const servicePoints = ['企业批采', 'LOGO 定制', '礼盒包装', '专人选品'];

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="750" height="750" viewBox="0 0 750 750"><rect fill="%23f5f5f5" width="750" height="750"/><text x="375" y="385" text-anchor="middle" fill="%23ccc" font-size="28">暂无图片</text></svg>';

onLoad((opt: any) => {
  if (opt.id) {
    id.value = Number(opt.id);
    loadProduct();
  }
});

async function loadProduct() {
  try {
    const res = await api.products.detail(id.value);
    product.value = res as any;
    if (!product.value?.id) product.value = getDemoProduct(id.value) as any;
    // 初始化规格选择
    if (product.value?.specs) {
      product.value.specs.forEach((s: Spec) => {
        if (s.values.length > 0) {
          selectedSpecs.value[s.name] = s.values[0];
        }
      });
    }
  } catch (_) {
    product.value = getDemoProduct(id.value) as any;
    if (product.value?.specs) {
      product.value.specs.forEach((s: Spec) => {
        if (s.values.length > 0) {
          selectedSpecs.value[s.name] = s.values[0];
        }
      });
    }
  }
}

const specText = computed(() => {
  const vals = Object.values(selectedSpecs.value);
  return vals.length ? vals.join(' / ') : '';
});

const currentPrice = computed(() => {
  return product.value?.price || 0;
});

function selectSpec(name: string, value: string) {
  selectedSpecs.value[name] = value;
}

function changeQuantity(delta: number) {
  quantity.value = Math.max(1, Math.min(99, quantity.value + delta));
}

function openSpecPanel() {
  showSpecPanel.value = true;
}

function closeSpecPanel() {
  showSpecPanel.value = false;
}

async function addToCart() {
  if (!product.value || cartLoading.value) return;
  cartLoading.value = true;
  try {
    await api.cart.add({
      productId: product.value.id,
      quantity: quantity.value,
      spec: specText.value || undefined,
    });
    uni.showToast({ title: '已加入购物车', icon: 'success' });
    showSpecPanel.value = false;
    quantity.value = 1;
  } catch (_) {
    uni.showToast({ title: '添加失败', icon: 'none' });
  } finally {
    cartLoading.value = false;
  }
}

async function buyNow() {
  if (!product.value) return;
  // 先加购物车再跳转结算
  if (product.value.specs && product.value.specs.length > 0) {
    showSpecPanel.value = true;
    return;
  }
  await api.cart.add({
    productId: product.value.id,
    quantity: 1,
  });
  uni.switchTab({ url: '/pages/cart/cart' });
}

function shareProduct() {
  if (!product.value) return;
  api.share.record(product.value.id).catch(() => {});
  uni.share({
    provider: 'weixin',
    scene: 'session',
    type: 0,
    title: product.value.shareTitle || product.value.name,
    summary: product.value.shareDesc || '',
    imageUrl: product.value.coverImage,
    success: () => uni.showToast({ title: '分享成功 +10积分', icon: 'none' }),
  });
}

function onSwiperChange(e: any) {
  currentImageIndex.value = e.detail.current;
}
</script>

<template>
  <view class="page" v-if="product">
    <!-- 商品轮播 -->
    <swiper
      class="detail-swiper"
      autoplay
      circular
      indicator-dots
      indicator-color="rgba(255,255,255,0.4)"
      indicator-active-color="#D4A574"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(img, i) in (product.images && product.images.length ? product.images : [product.coverImage])" :key="i">
        <image :src="img || productPlaceholder" class="swiper-img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 基本信息 -->
    <view class="product-main">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</text>
        <text class="sales">已售 {{ product.sales || 0 }}</text>
      </view>
      <text class="product-title">{{ product.name }}</text>
      <text class="product-desc" v-if="product.description">{{ product.description }}</text>
      <view class="tag-row" v-if="product.tags && product.tags.length">
        <text class="tag" v-for="t in product.tags" :key="t">{{ t }}</text>
      </view>
    </view>

    <view class="service-panel">
      <view class="service-item" v-for="item in servicePoints" :key="item">
        <text class="service-dot"></text>
        <text class="service-text">{{ item }}</text>
      </view>
    </view>

    <view class="custom-panel">
      <view>
        <text class="custom-title">企业定制预留入口</text>
        <text class="custom-desc">后续可接入报价单、定制需求表和客服咨询</text>
      </view>
      <text class="custom-action">咨询</text>
    </view>

    <!-- 规格选择入口 -->
    <view class="spec-entry" @tap="openSpecPanel" v-if="product.specs && product.specs.length">
      <text class="spec-label">已选</text>
      <text class="spec-value">{{ specText || '请选择规格' }}</text>
      <text class="spec-arrow">&gt;</text>
    </view>

    <!-- 商品详情（占位） -->
    <view class="detail-section">
      <view class="section-title">商品详情</view>
      <rich-text class="detail-content" :nodes="product.description || '暂无详情描述'"></rich-text>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="action-item" @tap="shareProduct">
        <text>📤</text>
        <text class="action-text">分享</text>
      </view>
      <view class="action-item" @tap="uni.switchTab({url:'/pages/cart/cart'})">
        <text>🛒</text>
        <text class="action-text">购物车</text>
      </view>
      <view class="cart-btn" @tap="addToCart">加入购物车</view>
      <view class="buy-btn" @tap="buyNow">立即购买</view>
    </view>

    <!-- 规格选择弹窗 -->
    <view class="spec-overlay" v-if="showSpecPanel" @tap="closeSpecPanel">
      <view class="spec-panel" @tap.stop>
        <view class="panel-header">
          <image :src="product.coverImage || productPlaceholder" class="panel-img" mode="aspectFill" />
          <view class="panel-price-info">
            <text class="panel-price">¥{{ currentPrice }}</text>
            <text class="panel-stock">库存 {{ product.stock }} 件</text>
          </view>
          <text class="panel-close" @tap="closeSpecPanel">✕</text>
        </view>

        <view class="panel-body" v-if="product.specs">
          <view class="spec-group" v-for="spec in product.specs" :key="spec.name">
            <text class="spec-group-name">{{ spec.name }}</text>
            <view class="spec-values">
              <text
                class="spec-value-btn"
                :class="{ active: selectedSpecs[spec.name] === val }"
                v-for="val in spec.values"
                :key="val"
                @tap="selectSpec(spec.name, val)"
              >{{ val }}</text>
            </view>
          </view>
        </view>

        <!-- 数量选择 -->
        <view class="quantity-row">
          <text class="quantity-label">数量</text>
          <view class="quantity-control">
            <text class="qty-btn" @tap="changeQuantity(-1)">−</text>
            <text class="qty-num">{{ quantity }}</text>
            <text class="qty-btn" @tap="changeQuantity(1)">+</text>
          </view>
        </view>

        <view class="panel-footer">
          <view class="panel-cart-btn" @tap="addToCart">加入购物车</view>
        </view>
      </view>
    </view>
  </view>

  <!-- 加载中 -->
  <view class="empty-page" v-else>
    <text>加载中...</text>
  </view>
</template>

<style scoped>
.page { background: #f6f7f8; min-height: 100vh; }
.detail-swiper { width: 100%; height: 750rpx; }
.swiper-img { width: 100%; height: 100%; }

.product-main { padding: 30rpx; background: #fff; }
.price-row { display: flex; align-items: center; }
.price { font-size: 44rpx; font-weight: 700; color: #b9824f; }
.original { font-size: 26rpx; color: #ccc; text-decoration: line-through; margin-left: 16rpx; }
.sales { font-size: 22rpx; color: #999; margin-left: auto; }
.product-title { font-size: 32rpx; color: #333; font-weight: 500; margin-top: 16rpx; display: block; line-height: 1.5; }
.product-desc { font-size: 26rpx; color: #999; margin-top: 12rpx; display: block; line-height: 1.6; }
.tag-row { margin-top: 12rpx; display: flex; flex-wrap: wrap; gap: 8rpx; }
.tag { background: #f7efe6; color: #8d633d; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 6rpx; }

.service-panel {
  display: flex;
  flex-wrap: wrap;
  margin: 16rpx 0;
  padding: 20rpx 30rpx;
  background: #fff;
}
.service-item {
  width: 50%;
  display: flex;
  align-items: center;
  line-height: 42rpx;
}
.service-dot {
  width: 10rpx;
  height: 10rpx;
  margin-right: 12rpx;
  border-radius: 50%;
  background: #b9824f;
}
.service-text {
  color: #6f6256;
  font-size: 23rpx;
}
.custom-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 16rpx;
  padding: 24rpx 30rpx;
  background: #fff7ec;
}
.custom-title {
  display: block;
  color: #2f2924;
  font-size: 27rpx;
  font-weight: 650;
}
.custom-desc {
  display: block;
  margin-top: 8rpx;
  color: #8a7a6a;
  font-size: 22rpx;
}
.custom-action {
  min-width: 96rpx;
  height: 52rpx;
  line-height: 52rpx;
  text-align: center;
  border-radius: 8rpx;
  background: #8d633d;
  color: #fff;
  font-size: 24rpx;
}

/* 规格入口 */
.spec-entry { margin: 16rpx 0; padding: 24rpx 30rpx; background: #fff; display: flex; align-items: center; }
.spec-label { font-size: 26rpx; color: #666; margin-right: 16rpx; }
.spec-value { flex: 1; font-size: 26rpx; color: #333; }
.spec-arrow { font-size: 28rpx; color: #ccc; }

/* 详情区 */
.detail-section { margin: 16rpx 0 140rpx; padding: 30rpx; background: #fff; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; margin-bottom: 20rpx; }
.detail-content { font-size: 26rpx; color: #666; line-height: 1.8; }

/* 底部操作栏 */
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; background: #fff; padding: 12rpx 24rpx; padding-bottom: calc(12rpx + env(safe-area-inset-bottom)); border-top: 1rpx solid #f0f0f0; z-index: 100; }
.action-item { display: flex; flex-direction: column; align-items: center; margin-right: 30rpx; font-size: 20rpx; color: #666; min-width: 80rpx; }
.action-text { margin-top: 4rpx; }
.cart-btn { flex: 1; background: #f6eee5; color: #8d633d; text-align: center; height: 80rpx; line-height: 80rpx; border-radius: 8rpx; font-size: 28rpx; margin-right: 16rpx; }
.buy-btn { flex: 1; background: #8d633d; color: #fff; text-align: center; height: 80rpx; line-height: 80rpx; border-radius: 8rpx; font-size: 28rpx; }

/* 规格弹窗 */
.spec-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; }
.spec-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 30rpx; width: 100%; max-height: 70vh; overflow-y: auto; }
.panel-header { display: flex; align-items: center; margin-bottom: 30rpx; }
.panel-img { width: 160rpx; height: 160rpx; border-radius: 16rpx; }
.panel-price-info { flex: 1; margin-left: 20rpx; }
.panel-price { font-size: 36rpx; font-weight: 600; color: #b9824f; display: block; }
.panel-stock { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.panel-close { font-size: 36rpx; color: #999; padding: 10rpx; }
.spec-group { margin-bottom: 24rpx; }
.spec-group-name { font-size: 26rpx; color: #333; font-weight: 500; display: block; margin-bottom: 12rpx; }
.spec-values { display: flex; flex-wrap: wrap; gap: 12rpx; }
.spec-value-btn { padding: 12rpx 28rpx; border: 1rpx solid #e0e0e0; border-radius: 8rpx; font-size: 24rpx; color: #333; }
.spec-value-btn.active { border-color: #8d633d; color: #8d633d; background: #FDF6EF; }
.quantity-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30rpx; }
.quantity-label { font-size: 26rpx; color: #333; }
.quantity-control { display: flex; align-items: center; }
.qty-btn { width: 56rpx; height: 56rpx; line-height: 56rpx; text-align: center; border: 1rpx solid #e0e0e0; font-size: 32rpx; color: #333; }
.qty-num { width: 80rpx; text-align: center; font-size: 28rpx; border-top: 1rpx solid #e0e0e0; border-bottom: 1rpx solid #e0e0e0; height: 56rpx; line-height: 56rpx; }
.panel-footer {}
.panel-cart-btn { background: #8d633d; color: #fff; text-align: center; height: 88rpx; line-height: 88rpx; border-radius: 8rpx; font-size: 30rpx; }

.empty-page { display: flex; justify-content: center; padding: 200rpx 0; color: #999; }
</style>
