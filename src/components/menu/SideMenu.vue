<template>
  <q-drawer
    v-model="drawerOpen"
    show-if-above
    bordered
    class="side-menu bg-grey-1"
    data-testid="side-menu"
  >
  <q-scroll-area class="side-menu__scroll">
    <q-list
      padding
      role="tree"
      :aria-label="t('menu.navigation')"
      aria-orientation="vertical"
    >
      <q-item-label header class="text-grey-7 text-uppercase text-caption">
        {{ t('menu.navigation') }}
      </q-item-label>

      <MenuCategory
        v-for="category in categories"
        :key="category.id"
        :category="category"
      />
    </q-list>
  </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import MenuCategory from './MenuCategory.vue';
import { useMenuStore } from '@/stores/menu-store';

const menuStore = useMenuStore();
const { t } = useI18n();
let route: ReturnType<typeof useRoute> | null = null;

try {
  route = useRoute();
} catch {
  route = null;
}

const categories = computed(() => menuStore.categories);

const drawerOpen = computed({
  get: () => menuStore.leftDrawerOpen,
  set: (value: boolean) => menuStore.setDrawer(value),
});

if (route) {
  watch(
    () => route?.path,
    (path) => {
      if (!path) {
        return;
      }
      menuStore.setActiveMenuItem(path);
    },
    { immediate: true },
  );
}
</script>

<style scoped>
.side-menu {
  min-width: 260px;
}

.side-menu__scroll {
  height: 100%;
}
</style>

