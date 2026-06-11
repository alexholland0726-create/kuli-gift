<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { api } from '@/api/index';
import { demoCategories, demoProducts } from '@/api/mock';

interface Category {
  id: number;
  name: string;
  icon: string;
}

const categories = ref<Category[]>(demoCategories);
const activeIndex = ref(0);
const loading = ref(false);

const currentProducts = computed(() => {
  const current = categories.value[activeIndex.value];
  if (!current) return [];
  return demoProducts.filter((item) => item.categoryId === current.id);
});

onMounted(async () => {
  try {
    const res = await api.categories.list();
    const realCategories = Array.isArray(res) ? res : [];
    if (realCategories.length) categories.value = realCategories;
  } catch (_) {}
});

function selectCategory(index: number) {
  activeIndex.value = index;
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
          v-for="(cat, i) in categories"
          :key="cat.id"
          @tap="selectCategory(i)"
        >
          <text class="nav-text">{{ cat.name }}</text>
        </view>
      </scroll-view>

      <scroll-view class="right-panel" scroll-y>
        <view class="panel-head">
          <text class="panel-title">{{ categories[activeIndex]?.name || '全部分类' }}</text>
          <text class="panel-action" @tap="goProductList(categories[activeIndex]?.id)">查看商品</text>
        </view>

        <view class="sub-grid">
          <view
            class="sub-item"
            v-for="item in currentProducts"
            :key="item.id"
            @tap="goProductList(item.categoryId)"
          >
            <image
              class="sub-img"
              :src="item.coverImage || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22 viewBox=%220 0 160 160%22><rect width=%22160%22 height=%22160%22 rx=%2220%22 fill=%22%23f7faf4%22/><circle cx=%2280%22 cy=%2268%22 r=%2232%22 fill=%22%23d7ebcf%22/><rect x=%2242%22 y=%22108%22 width=%2276%22 height=%2224%22 rx=%2212%22 fill=%22%2393bf82%22/></svg>'"
              mode="aspectFill"
            />
            <text class="sub-name">{{ item.name.replace('礼盒', '').slice(0, 8) }}</text>
          </view>
          <view class="sub-item empty-sub" v-if="!currentProducts.length">
            <text class="empty-text">暂无商品</text>
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
