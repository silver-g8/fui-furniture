<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5">{{ t('catalog.categories.title') }}</div>
          <div class="text-subtitle2 text-grey-7">{{ t('catalog.categories.subtitle') }}</div>
        </div>
        <q-btn
          flat
          color="primary"
          icon="refresh"
          :label="t('catalog.categories.actions.refresh')"
          :loading="categoryStore.loading"
          @click="loadTree"
        />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="categoryStore.loading" class="q-pa-xl flex flex-center">
        <q-spinner size="42px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <q-tree
              :nodes="treeNodes"
              node-key="id"
              :selected="selectedId"
              default-expand-all
              @update:selected="handleSelect"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1">
                  {{ selectedNode?.name ?? t('catalog.categories.detail.title') }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ selectedNode?.slug ?? '—' }}
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section>
                <q-list bordered dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.categories.detail.parent') }}</q-item-label>
                      <q-item-label>{{ parentName }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.categories.detail.status') }}</q-item-label>
                      <q-item-label>
                        <q-badge :color="selectedNode?.isActive ? 'positive' : 'grey'">
                          {{ selectedNode?.isActive ? t('catalog.common.active') : t('catalog.common.inactive') }}
                        </q-badge>
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.categories.detail.depth') }}</q-item-label>
                      <q-item-label>{{ selectedNode?.depth ?? '—' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <q-separator />

              <q-card-actions align="right">
                <q-btn flat color="primary" icon="add" :label="t('catalog.categories.actions.addChild')" />
                <q-btn flat color="primary" icon="edit" :label="t('catalog.categories.actions.edit')" />
                <q-btn flat color="negative" icon="delete" :label="t('catalog.categories.actions.delete')" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTreeNode } from 'quasar';
import type { CategoryNode } from '@/types/catalog';
import { useCategoryStore } from '@/stores/catalog/useCategoryStore';
import { useNotifier } from '@/composables/useNotifier';
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';

const categoryStore = useCategoryStore();
const { t } = useI18n();
const { error: notifyError } = useNotifier();
const { withLoading } = useLoadingOverlay();

const treeNodes = computed<QTreeNode[]>(() =>
  categoryStore.tree.map((node) => ({
    label: node.name,
    id: node.id,
    children: node.children?.map((child) => ({
      label: child.name,
      id: child.id,
      children: child.children?.map((grand) => ({
        label: grand.name,
        id: grand.id,
        children: [],
      })),
    })),
  })),
);

const selectedNode = computed(() => categoryStore.selected);
const selectedId = computed(() => categoryStore.selected?.id ?? null);

const parentName = computed(() => {
  if (!categoryStore.selected?.parentId) {
    return '—';
  }

  const findNode = (nodes: CategoryNode[], id: number): CategoryNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const found = findNode(node.children ?? [], id);
      if (found) {
        return found;
      }
    }
    return undefined;
  };

  const parent = findNode(categoryStore.tree, categoryStore.selected.parentId);
  return parent?.name ?? '—';
});

const loadTree = async () => {
  try {
    await withLoading(() => categoryStore.loadTree(), {
      message: t('catalog.common.loading'),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.categories.notify.loadError');
    notifyError({ message });
  }
};

const handleSelect = (id: number | null) => {
  if (id === null) {
    categoryStore.setSelected(null);
    return;
  }

  const findNode = (nodes: CategoryNode[], targetId: number): CategoryNode | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      const child = findNode(node.children ?? [], targetId);
      if (child) {
        return child;
      }
    }
    return null;
  };

  const node = findNode(categoryStore.tree, id);
  categoryStore.setSelected(node);
};

onMounted(() => {
  void loadTree();
});
</script>

