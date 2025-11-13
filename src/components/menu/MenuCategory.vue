<template>
  <q-expansion-item
    expand-separator
    switch-toggle-side
    dense
    :dense-toggle="true"
    :label="t(category.label)"
    :data-testid="'menu-category'"
    :data-category-id="category.id"
    :model-value="isExpanded"
    @update:model-value="handleToggle"
  >
    <template #header>
      <q-item-section avatar>
        <q-icon :name="category.icon" />
      </q-item-section>
      <q-item-section>
        <q-item-label class="text-subtitle2">
          {{ t(category.label) }}
        </q-item-label>
      </q-item-section>
    </template>

    <div class="menu-category__items" role="group">
      <MenuItem
        v-for="item in category.items"
        :key="item.id"
        :item="item"
        :depth="0"
      />
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MenuCategory } from '@/types/menu';
import { useMenuStore } from '@/stores/menu-store';
import MenuItem from './MenuItem.vue';

defineOptions({
  name: 'MenuCategory',
});

const props = defineProps<{
  category: MenuCategory;
}>();

const { t } = useI18n();
const menuStore = useMenuStore();

const isExpanded = computed(() => menuStore.isCategoryExpanded(props.category.id));

const handleToggle = (value: boolean) => {
  if (value) {
    menuStore.expandCategory(props.category.id);
  } else {
    menuStore.collapseCategory(props.category.id);
  }
};
</script>

<style scoped>
.menu-category__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>

