<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref('');
const hotSearches = ['礼品', '定制', '企业团购', '商务礼品', '节日礼物'];

function doSearch() {
  if (!keyword.value.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/product/list?keyword=${encodeURIComponent(keyword.value.trim())}`,
  });
}

function onHotTap(kw: string) {
  uni.navigateTo({
    url: `/pages/product/list?keyword=${encodeURIComponent(kw)}`,
  });
}
</script>

<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索礼品..."
          :confirm-type="'search'"
          :focus="true"
          @confirm="doSearch"
        />
      </view>
      <text class="cancel-btn" @tap="uni.navigateBack()">取消</text>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-section">
      <text class="section-title">热门搜索</text>
      <view class="hot-tags">
        <text class="hot-tag" v-for="kw in hotSearches" :key="kw" @tap="onHotTap(kw)">{{ kw }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { background: #fff; min-height: 100vh; }

.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 68rpx;
  background: #f5f5f5;
  border-radius: 34rpx;
  padding: 0 20rpx;
}
.search-icon { font-size: 26rpx; margin-right: 10rpx; }
.search-input { flex: 1; font-size: 26rpx; height: 68rpx; }
.cancel-btn { margin-left: 16rpx; color: #666; font-size: 28rpx; }

.hot-section { padding: 30rpx 24rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 20rpx; }
.hot-tags { display: flex; flex-wrap: wrap; gap: 16rpx; }
.hot-tag { background: #f5f5f5; color: #666; font-size: 26rpx; padding: 12rpx 28rpx; border-radius: 30rpx; }
</style>
