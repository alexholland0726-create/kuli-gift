import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  const badgeCount = ref(0);

  function setBadge(count: number) {
    badgeCount.value = count;
  }

  return { badgeCount, setBadge };
});
