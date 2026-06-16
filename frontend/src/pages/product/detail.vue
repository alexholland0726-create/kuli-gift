<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
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
  price: number | string;
  originalPrice?: number | string;
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
const loading = ref(false);
const actionType = ref<'cart' | 'buy'>('cart');

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="750" height="750" viewBox="0 0 750 750"><rect fill="%23f5f5f5" width="750" height="750"/><text x="375" y="385" text-anchor="middle" fill="%23aaa" font-size="28">暂无图片</text></svg>';

onLoad((opt: any) => {
  enableShareMenu();
  if (opt.id) {
    id.value = Number(opt.id);
    loadProduct();
  }
});

function enableShareMenu() {
  (uni as any).showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

async function loadProduct() {
  try {
    const res = await api.products.detail(id.value);
    product.value = res as Product;
  } catch (_) {
    product.value = getDemoProduct(id.value) as any;
  }
  initSpecs();
}

function initSpecs() {
  selectedSpecs.value = {};
  product.value?.specs?.forEach((spec) => {
    if (spec.values?.length) selectedSpecs.value[spec.name] = spec.values[0];
  });
}

const gallery = computed(() => {
  if (!product.value) return [];
  return product.value.images?.length ? product.value.images : [product.value.coverImage];
});

const specText = computed(() => Object.values(selectedSpecs.value).filter(Boolean).join(' / '));
const currentPrice = computed(() => Number(product.value?.price || 0).toFixed(2));
const isInquiryProduct = computed(() => Number(product.value?.price || 0) <= 0);
const priceText = computed(() => isInquiryProduct.value ? '询价' : `¥${currentPrice.value}`);
const categoryName = computed(() => {
  const map: Record<number, string> = {
    1: '端午礼盒',
    2: '食品礼盒',
    3: '生鲜滋补',
    4: '家居家纺',
    5: '厨具餐具',
    6: '商务箱包',
    7: '数码小电',
    8: '保温杯',
    9: '运动户外',
  };
  return map[product.value?.categoryId || 0] || product.value?.tags?.[0] || '企业礼品';
});
const brandName = computed(() => product.value?.tags?.[0] || product.value?.name?.split(' ')[0] || '精选品牌');
const sellingPoints = computed(() => {
  const category = categoryName.value;
  const brand = brandName.value;
  return [
    `${brand}资料精选，适合企业福利、客户答谢和活动礼赠`,
    `归入${category}品类，方便按预算、场景和人群快速选品`,
    isInquiryProduct.value ? '支持批量询价和方案报价' : `参考售价 ${priceText.value}，可作为采购预算初筛`,
  ];
});
const serviceItems = [
  { title: '企业批采', desc: '多件起采可询价' },
  { title: 'LOGO定制', desc: '按产品支持印制' },
  { title: '礼盒包装', desc: '节庆/商务包装' },
  { title: '专人选品', desc: '按预算推荐方案' },
];
const detailRows = computed(() => [
  { label: '品牌/系列', value: brandName.value },
  { label: '商品品类', value: categoryName.value },
  { label: '采购方式', value: isInquiryProduct.value ? '企业询价' : '现价购买 / 批量询价' },
  { label: '库存状态', value: `${product.value?.stock || 0} 件` },
]);
const sceneTags = computed(() => {
  const category = categoryName.value;
  if (category.includes('箱包')) return ['会议伴手礼', '员工入职', '商务出差', '客户答谢'];
  if (category.includes('数码') || category.includes('小电')) return ['员工福利', '健康关怀', '积分兑换', '活动奖品'];
  if (category.includes('保温杯')) return ['办公日用', '活动赠品', '品牌定制', '客户拜访'];
  if (category.includes('户外')) return ['企业团建', '户外活动', '露营场景', '福利兑换'];
  if (category.includes('家居')) return ['员工福利', '节日慰问', '家庭日用', '积分礼品'];
  return ['商务礼赠', '节庆福利', '客户答谢', '批量采购'];
});

function selectSpec(name: string, value: string) {
  selectedSpecs.value[name] = value;
}

function changeQuantity(delta: number) {
  quantity.value = Math.max(1, Math.min(99, quantity.value + delta));
}

function openSpecPanel(type: 'cart' | 'buy') {
  actionType.value = type;
  showSpecPanel.value = true;
}

function closeSpecPanel() {
  showSpecPanel.value = false;
}

async function addToCart(thenGoCart = false) {
  if (!product.value || loading.value) return;
  loading.value = true;
  try {
    await api.cart.add({
      productId: product.value.id,
      quantity: quantity.value,
      spec: specText.value || undefined,
    });
    uni.showToast({ title: '已加入选品池', icon: 'success' });
    showSpecPanel.value = false;
    if (thenGoCart) {
      setTimeout(() => uni.switchTab({ url: '/pages/cart/cart' }), 500);
    }
  } catch (err: any) {
    uni.showToast({ title: err?.data?.message || '请先登录后再选品', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function handleCart() {
  if (product.value?.specs?.length) openSpecPanel('cart');
  else addToCart(false);
}

function handleBuy() {
  if (isInquiryProduct.value) {
    uni.showToast({ title: '该商品待报价，先加入选品池', icon: 'none' });
    if (product.value?.specs?.length) openSpecPanel('cart');
    else addToCart(false);
    return;
  }
  if (product.value?.specs?.length) openSpecPanel('buy');
  else addToCart(true);
}

function confirmSpec() {
  addToCart(actionType.value === 'buy' && !isInquiryProduct.value);
}

onShareAppMessage(() => {
  const item = product.value;
  return {
    title: item?.shareTitle || item?.name || '酷礼工坊商品推荐',
    path: `/pages/product/detail?id=${id.value}`,
    imageUrl: item?.coverImage || '',
  };
});

onShareTimeline(() => {
  const item = product.value;
  return {
    title: item?.shareTitle || item?.name || '酷礼工坊商品推荐',
    query: `id=${id.value}`,
    imageUrl: item?.coverImage || '',
  };
});
</script>

<template>
  <view class="page" v-if="product">
    <swiper class="detail-swiper" circular indicator-dots indicator-color="rgba(255,255,255,.45)" indicator-active-color="#7fb069">
      <swiper-item v-for="(img, i) in gallery" :key="i">
        <image :src="img || productPlaceholder" class="swiper-img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <view class="product-main">
      <view class="price-row">
        <text class="price">{{ priceText }}</text>
        <text class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</text>
        <text class="stock">库存 {{ product.stock || 0 }}</text>
      </view>
      <text class="product-title">{{ product.name }}</text>
      <text class="product-desc">{{ product.description }}</text>
      <view class="tag-row" v-if="product.tags?.length">
        <text class="tag" v-for="tag in product.tags" :key="tag">{{ tag }}</text>
      </view>
    </view>

    <view class="service-panel">
      <view class="service-item" v-for="item in serviceItems" :key="item.title">
        <text class="service-check">✓</text>
        <view>
          <text class="service-title">{{ item.title }}</text>
          <text class="service-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="spec-entry" @tap="openSpecPanel('cart')" v-if="product.specs?.length">
      <text class="spec-label">已选</text>
      <text class="spec-value">{{ specText || '请选择规格' }}</text>
      <text class="spec-arrow">›</text>
    </view>

    <view class="detail-section">
      <view class="section-head">
        <text class="section-title">核心卖点</text>
        <text class="section-subtitle">企业采购关注点</text>
      </view>
      <view class="point-list">
        <view class="point-item" v-for="(point, index) in sellingPoints" :key="point">
          <text class="point-index">0{{ index + 1 }}</text>
          <text class="point-text">{{ point }}</text>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-head">
        <text class="section-title">规格参数</text>
        <text class="section-subtitle">选品基础信息</text>
      </view>
      <view class="param-table">
        <view class="param-row" v-for="row in detailRows" :key="row.label">
          <text class="param-label">{{ row.label }}</text>
          <text class="param-value">{{ row.value }}</text>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-head">
        <text class="section-title">适用场景</text>
        <text class="section-subtitle">可用于方案组合</text>
      </view>
      <view class="scene-grid">
        <text class="scene-tag" v-for="tag in sceneTags" :key="tag">{{ tag }}</text>
      </view>
    </view>

    <view class="detail-section visual-section">
      <view class="section-head">
        <text class="section-title">图文详情</text>
        <text class="section-subtitle">商品展示与采购说明</text>
      </view>
      <view class="detail-hero">
        <image :src="product.coverImage || productPlaceholder" class="detail-hero-img" mode="aspectFit" />
      </view>
      <text class="detail-content">{{ product.description || '暂无详情描述' }}</text>
      <view class="purchase-note">
        <text>可按预算、数量、交期和是否定制 LOGO 进一步确认方案。</text>
      </view>
    </view>

    <view class="action-bar">
      <view class="action-item" @tap="uni.switchTab({url:'/pages/index/index'})">
        <text>首页</text>
      </view>
      <view class="action-item" @tap="uni.switchTab({url:'/pages/cart/cart'})">
        <text>选品池</text>
      </view>
      <view class="cart-btn" @tap="handleCart">加入选品池</view>
      <view class="buy-btn" @tap="handleBuy">{{ isInquiryProduct ? '加入询价' : '立即购买' }}</view>
    </view>

    <view class="spec-overlay" v-if="showSpecPanel" @tap="closeSpecPanel">
      <view class="spec-panel" @tap.stop>
        <view class="panel-header">
          <image :src="product.coverImage || productPlaceholder" class="panel-img" mode="aspectFill" />
          <view class="panel-info">
            <text class="panel-price">{{ priceText }}</text>
            <text class="panel-stock">库存 {{ product.stock || 0 }} 件</text>
          </view>
          <text class="panel-close" @tap="closeSpecPanel">×</text>
        </view>

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

        <view class="quantity-row">
          <text>数量</text>
          <view class="quantity-control">
            <text class="qty-btn" @tap="changeQuantity(-1)">-</text>
            <text class="qty-num">{{ quantity }}</text>
            <text class="qty-btn" @tap="changeQuantity(1)">+</text>
          </view>
        </view>

        <view class="panel-confirm" :class="{ disabled: loading }" @tap="confirmSpec">
          {{ actionType === 'buy' && !isInquiryProduct ? '加入并去结算' : '加入选品池' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #f6f7f4; padding-bottom: 136rpx; }
.detail-swiper { height: 640rpx; background: linear-gradient(180deg, #eef7e8, #f8faf4); }
.swiper-img { width: 100%; height: 100%; }
.product-main { margin: -28rpx 20rpx 20rpx; padding: 30rpx; background: #fff; border-radius: 22rpx; position: relative; z-index: 2; box-shadow: 0 12rpx 34rpx rgba(65, 91, 48, .08); }
.price-row { display: flex; align-items: baseline; gap: 16rpx; }
.price { color: #d9553f; font-size: 44rpx; font-weight: 800; }
.original { color: #aaa; font-size: 24rpx; text-decoration: line-through; }
.stock { margin-left: auto; color: #8c9288; font-size: 24rpx; }
.product-title { display: block; margin-top: 14rpx; color: #20251f; font-size: 34rpx; font-weight: 700; line-height: 1.45; }
.product-desc { display: block; margin-top: 12rpx; color: #6f766c; font-size: 26rpx; line-height: 1.6; white-space: pre-wrap; }
.tag-row { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 18rpx; }
.tag { padding: 6rpx 14rpx; background: #edf7e8; color: #5f9d46; border-radius: 999rpx; font-size: 22rpx; }
.service-panel { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; margin: 0 20rpx 20rpx; padding: 20rpx; background: #fff; border-radius: 18rpx; color: #66715f; }
.service-item { display: flex; align-items: center; gap: 14rpx; min-height: 76rpx; padding: 10rpx 12rpx; background: #f8fbf5; border-radius: 14rpx; }
.service-check { width: 34rpx; height: 34rpx; line-height: 34rpx; text-align: center; border-radius: 50%; background: #e2f3d8; color: #5f9d46; font-size: 22rpx; font-weight: 800; flex: 0 0 34rpx; }
.service-title { display: block; color: #283323; font-size: 25rpx; font-weight: 700; }
.service-desc { display: block; margin-top: 4rpx; color: #8a9283; font-size: 21rpx; }
.spec-entry, .detail-section { margin: 0 20rpx 20rpx; padding: 28rpx; background: #fff; border-radius: 18rpx; }
.spec-entry { display: flex; align-items: center; gap: 16rpx; }
.spec-label { color: #8c9288; }
.spec-value { flex: 1; color: #20251f; }
.spec-arrow { font-size: 44rpx; color: #b8bdb2; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16rpx; margin-bottom: 18rpx; }
.section-title { font-size: 31rpx; color: #20251f; font-weight: 800; }
.section-subtitle { color: #9aa290; font-size: 22rpx; }
.point-list { display: flex; flex-direction: column; gap: 14rpx; }
.point-item { display: flex; gap: 16rpx; padding: 18rpx; background: #f8fbf5; border-radius: 14rpx; }
.point-index { color: #78ad5f; font-size: 24rpx; font-weight: 800; }
.point-text { flex: 1; color: #4f594b; font-size: 25rpx; line-height: 1.55; }
.param-table { border: 1rpx solid #edf0e8; border-radius: 14rpx; overflow: hidden; }
.param-row { display: flex; min-height: 72rpx; border-bottom: 1rpx solid #edf0e8; }
.param-row:last-child { border-bottom: 0; }
.param-label { width: 180rpx; padding: 20rpx; background: #f8faf5; color: #8a9283; font-size: 24rpx; }
.param-value { flex: 1; padding: 20rpx; color: #2f382b; font-size: 24rpx; line-height: 1.45; }
.scene-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14rpx; }
.scene-tag { height: 68rpx; line-height: 68rpx; text-align: center; border-radius: 14rpx; background: #fff8ea; color: #9a6b25; font-size: 25rpx; font-weight: 700; }
.visual-section { padding-bottom: 32rpx; }
.detail-hero { height: 460rpx; border-radius: 18rpx; background: linear-gradient(180deg, #f7faf3, #eef5e9); overflow: hidden; margin-bottom: 22rpx; }
.detail-hero-img { width: 100%; height: 100%; }
.detail-content { display: block; color: #697066; font-size: 26rpx; line-height: 1.7; white-space: pre-wrap; }
.purchase-note { margin-top: 22rpx; padding: 18rpx 20rpx; background: #edf7e8; border-radius: 14rpx; color: #5f7f4f; font-size: 24rpx; line-height: 1.5; }
.action-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 12rpx; padding: 14rpx 20rpx calc(14rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -8rpx 28rpx rgba(0,0,0,.06); z-index: 20; }
.action-item { width: 96rpx; text-align: center; color: #6f766c; font-size: 22rpx; }
.cart-btn, .buy-btn { flex: 1; height: 76rpx; line-height: 76rpx; text-align: center; border-radius: 999rpx; font-size: 28rpx; font-weight: 700; }
.cart-btn { background: #edf7e8; color: #5f9d46; }
.buy-btn { background: linear-gradient(135deg, #8dc76f, #5f9d46); color: #fff; }
.spec-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.42); z-index: 30; display: flex; align-items: flex-end; }
.spec-panel { width: 100%; background: #fff; border-radius: 28rpx 28rpx 0 0; padding: 28rpx; padding-bottom: calc(28rpx + env(safe-area-inset-bottom)); }
.panel-header { display: flex; align-items: center; gap: 18rpx; margin-bottom: 24rpx; }
.panel-img { width: 140rpx; height: 140rpx; border-radius: 16rpx; background: #f5f5f5; }
.panel-info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.panel-price { color: #d9553f; font-size: 36rpx; font-weight: 800; }
.panel-stock { color: #8c9288; font-size: 24rpx; }
.panel-close { width: 52rpx; height: 52rpx; line-height: 52rpx; text-align: center; color: #8c9288; font-size: 42rpx; }
.spec-group { margin-top: 22rpx; }
.spec-group-name { display: block; color: #20251f; font-size: 26rpx; font-weight: 700; margin-bottom: 14rpx; }
.spec-values { display: flex; flex-wrap: wrap; gap: 14rpx; }
.spec-value-btn { padding: 14rpx 22rpx; border-radius: 999rpx; background: #f4f5f1; color: #596052; font-size: 24rpx; }
.spec-value-btn.active { background: #edf7e8; color: #5f9d46; font-weight: 700; }
.quantity-row { display: flex; justify-content: space-between; align-items: center; margin-top: 28rpx; color: #20251f; font-size: 26rpx; }
.quantity-control { display: flex; align-items: center; border: 1rpx solid #e1e5dc; border-radius: 999rpx; overflow: hidden; }
.qty-btn, .qty-num { width: 64rpx; height: 56rpx; line-height: 56rpx; text-align: center; }
.qty-num { width: 72rpx; background: #fafbf8; }
.panel-confirm { margin-top: 30rpx; height: 82rpx; line-height: 82rpx; text-align: center; border-radius: 999rpx; background: #5f9d46; color: #fff; font-size: 30rpx; font-weight: 800; }
.panel-confirm.disabled { opacity: .65; }
</style>
