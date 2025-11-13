<template>
  <div class="menu-item" :data-depth="depth">
    <q-item
      :ref="setItemRef"
      :data-testid="'menu-item'"
      :data-menu-id="item.id"
      data-menu-focusable="true"
      clickable
      v-ripple
      :active="isActive"
      active-class="bg-primary text-white"
      :tabindex="item.disabled ? -1 : 0"
      :aria-expanded="hasChildren ? isExpanded : undefined"
      :aria-level="depth + 1"
      :aria-controls="hasChildren ? childrenId : undefined"
      role="treeitem"
      @click="handleSelect"
      @keydown.enter.prevent="handleSelect"
      @keydown.space.prevent="handleSelect"
      @keydown.arrow-right.prevent="expandChildren"
      @keydown.arrow-left.prevent="collapseChildren"
      @keydown.arrow-down.prevent="focusNextItem"
      @keydown.arrow-up.prevent="focusPreviousItem"
    >
      <q-item-section avatar v-if="item.icon">
        <q-icon :name="item.icon" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ t(item.label) }}</q-item-label>
        <q-item-label caption v-if="item.badge">
          {{ item.badge.label }}
        </q-item-label>
      </q-item-section>

      <q-item-section side v-if="item.badge">
        <q-badge :color="item.badge.color ?? 'primary'" :floating="item.badge.floating">
          {{ item.badge.label }}
        </q-badge>
      </q-item-section>

      <q-item-section side v-if="hasChildren">
        <q-btn
          flat
          round
          dense
          size="sm"
          :class="['menu-item__toggle', { 'menu-item__toggle--expanded': isExpanded }]"
          :data-testid="'menu-item-toggle'"
          :icon="isExpanded ? 'expand_less' : 'expand_more'"
          :aria-label="toggleAriaLabel"
          @click.stop="toggleChildren"
        />
      </q-item-section>
    </q-item>

    <transition name="menu-collapse">
      <div
        v-if="hasChildren && isExpanded"
        class="menu-item__children"
        :id="childrenId"
        role="group"
      >
        <MenuItem
          v-for="child in item.items"
          :key="child.id"
          :item="child"
          :depth="depth + 1"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance, type VNodeRef } from 'vue';
import { useRouter, type Router } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QVueGlobals } from 'quasar';
import type { MenuItem as MenuItemType } from '@/types/menu';
import { useMenuStore } from '@/stores/menu-store';
import { useNavigationStore } from '@/stores/navigation-store';

defineOptions({
  name: 'MenuItem',
});

const props = withDefaults(
  defineProps<{
    item: MenuItemType;
    depth?: number;
  }>(),
  {
    depth: 0,
  },
);

const { t } = useI18n();
let router: Router | null = null;
try {
  router = useRouter();
} catch {
  router = null;
}
const menuStore = useMenuStore();
const navigationStore = useNavigationStore();
let $q: QVueGlobals | null = null;
const itemRef = ref<Element | ComponentPublicInstance | null>(null);

try {
  $q = useQuasar();
} catch {
  $q = null;
}

const resolveItemElement = (): HTMLElement | null => {
  const target = itemRef.value;
  if (!target) {
    return null;
  }

  if (target instanceof HTMLElement) {
    return target;
  }

  const element = (target as ComponentPublicInstance).$el;
  return element instanceof HTMLElement ? element : null;
};

const setItemRef: VNodeRef = (value) => {
  itemRef.value = value;
};

const isActive = computed(() => menuStore.activeMenuItem === props.item.route);
const hasChildren = computed(
  () => Array.isArray(props.item.items) && props.item.items.length > 0,
);
const isExpanded = computed(() => menuStore.isItemExpanded(props.item.id));
const childrenId = computed(() => `menu-children-${props.item.id}`);
const toggleAriaLabel = computed(() =>
  isExpanded.value ? t('menu.actions.collapse') : t('menu.actions.expand'),
);

const expandChildren = () => {
  if (hasChildren.value) {
    menuStore.expandItem(props.item.id);
  }
};

const collapseChildren = () => {
  if (hasChildren.value) {
    menuStore.collapseItem(props.item.id);
  }
};

const toggleChildren = () => {
  if (hasChildren.value) {
    menuStore.toggleItem(props.item.id);
  }
};

const focusSibling = (direction: 1 | -1) => {
  const currentElement = resolveItemElement();
  if (!currentElement) {
    return;
  }

  if (typeof document === 'undefined') {
    return;
  }

  const focusableItems = Array.from(
    document.querySelectorAll<HTMLElement>('[data-menu-focusable="true"]'),
  ).filter((element) => {
    const tabindex = element.getAttribute('tabindex');
    const ariaDisabled = element.getAttribute('aria-disabled');
    return tabindex !== '-1' && ariaDisabled !== 'true';
  });

  const currentIndex = focusableItems.findIndex((element) => element === currentElement);
  if (currentIndex === -1) {
    return;
  }

  const nextElement = focusableItems[currentIndex + direction];
  if (nextElement) {
    nextElement.focus();
  }
};

const focusNextItem = () => {
  focusSibling(1);
};

const focusPreviousItem = () => {
  focusSibling(-1);
};

const handleSelect = async () => {
  if (props.item.disabled) {
    return;
  }

  if (hasChildren.value) {
    expandChildren();
  }

  if (props.item.route) {
    menuStore.setActiveMenuItem(props.item.route);
    navigationStore.setCurrentRoute(props.item.route, {}, {});

    if (router) {
      try {
        await router.push(props.item.route);
      } catch (error) {
        console.warn('Navigation error', error);
      }
    }

    if ($q && $q.screen && $q.screen.lt && $q.screen.lt.md) {
      menuStore.setDrawer(false);
    }
  } else if (props.item.externalLink) {
    window.open(props.item.externalLink, '_blank');
  } else if (hasChildren.value) {
    toggleChildren();
  }
};
</script>

<style scoped>
.menu-item__children {
  margin-left: 16px;
  border-left: 1px solid var(--q-color-grey-4);
  padding-left: 12px;
}

.menu-item__toggle {
  transition: transform 0.2s ease;
}

.menu-item__toggle--expanded {
  transform: rotate(180deg);
}

.menu-collapse-enter-active,
.menu-collapse-leave-active {
  transition: all 0.2s ease;
}

.menu-collapse-enter-from,
.menu-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
