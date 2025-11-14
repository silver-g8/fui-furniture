<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5">{{ t('catalog.categories.title') }}</div>
          <div class="text-subtitle2 text-grey-7">{{ t('catalog.categories.subtitle') }}</div>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn
            color="primary"
            icon="add"
            :label="t('catalog.categories.actions.addRoot')"
            @click="openCreateRootDialog"
          />
          <q-btn
            flat
            color="primary"
            icon="refresh"
            :label="t('catalog.categories.actions.refresh')"
            :loading="categoryStore.loading"
            @click="loadTree"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="categoryStore.loading" class="q-pa-xl flex flex-center">
        <q-spinner size="42px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <q-tree
              v-if="treeNodes.length > 0"
              :nodes="treeNodes"
              node-key="id"
              :selected="selectedId"
              default-expand-all
              @update:selected="handleSelect"
            >
              <template #default-header="prop">
                <div class="row items-center justify-between full-width">
                  <div class="row items-center">
                    <span>{{ prop.node.label }}</span>
                  </div>
                  <div class="row items-center q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      size="sm"
                      icon="add"
                      @click.stop="openCreateChildDialog(prop.node.id)"
                    />
                    <q-btn
                      flat
                      dense
                      size="sm"
                      icon="edit"
                      @click.stop="openEditDialog(prop.node.id)"
                    />
                    <q-btn
                      flat
                      dense
                      size="sm"
                      icon="delete"
                      color="negative"
                      @click.stop="openDeleteDialog(prop.node.id)"
                    />
                  </div>
                </div>
              </template>
            </q-tree>
            <q-card v-else flat bordered class="q-pa-lg text-center">
              <div class="text-body2 text-grey-7">
                {{ t('catalog.categories.empty.message') }}
              </div>
              <q-btn
                color="primary"
                icon="add"
                :label="t('catalog.categories.actions.addRoot')"
                class="q-mt-md"
                @click="openCreateRootDialog"
              />
            </q-card>
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
                      <q-item-label overline>{{
                        t('catalog.categories.detail.parent')
                      }}</q-item-label>
                      <q-item-label>{{ parentName }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{
                        t('catalog.categories.detail.status')
                      }}</q-item-label>
                      <q-item-label>
                        <q-badge :color="selectedNode?.isActive ? 'positive' : 'grey'">
                          {{
                            selectedNode?.isActive
                              ? t('catalog.common.active')
                              : t('catalog.common.inactive')
                          }}
                        </q-badge>
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{
                        t('catalog.categories.detail.depth')
                      }}</q-item-label>
                      <q-item-label>{{ selectedNode?.depth ?? '—' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <q-separator />

              <q-card-actions align="right">
                <q-btn
                  flat
                  color="primary"
                  icon="add"
                  :label="t('catalog.categories.actions.addChild')"
                />
                <q-btn
                  flat
                  color="primary"
                  icon="edit"
                  :label="t('catalog.categories.actions.edit')"
                />
                <q-btn
                  flat
                  color="negative"
                  icon="delete"
                  :label="t('catalog.categories.actions.delete')"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="formDialog.visible">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{
              formDialog.mode === 'create'
                ? t('catalog.categories.form.createTitle')
                : t('catalog.categories.form.editTitle')
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="submitForm">
            <div class="q-gutter-md">
              <q-input
                v-model="form.name"
                :label="t('catalog.categories.form.fields.name')"
                :rules="[(val) => !!val || t('catalog.validation.required')]"
                :disable="formDialog.loading"
                dense
                outlined
              />

              <q-input
                v-model="form.slug"
                :label="t('catalog.categories.form.fields.slug')"
                :hint="t('catalog.categories.form.fields.slugHint')"
                :disable="formDialog.loading"
                dense
                outlined
              />

              <q-input
                v-if="formDialog.mode === 'create' && formDialog.parentName"
                :model-value="formDialog.parentName"
                :label="t('catalog.categories.form.fields.parent')"
                :disable="true"
                dense
                outlined
              />
              <q-input
                v-if="formDialog.mode === 'edit'"
                :model-value="formDialog.parentName || t('catalog.categories.form.fields.noParent')"
                :label="t('catalog.categories.form.fields.parent')"
                :disable="true"
                dense
                outlined
              />

              <q-toggle
                v-model="form.isActive"
                :label="t('catalog.categories.form.fields.isActive')"
                :disable="formDialog.loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            :label="t('common.actions.cancel')"
            v-close-popup
            :disable="formDialog.loading"
          />
          <q-btn
            unelevated
            color="primary"
            :label="t('common.actions.save')"
            :loading="formDialog.loading"
            @click="submitForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="deleteDialog.visible">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ t('catalog.categories.dialog.deleteTitle') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="q-mb-md">
            <p>
              {{ t('catalog.categories.dialog.deleteConfirm', { name: deleteDialog.targetName }) }}
            </p>
            <p class="text-negative text-caption">
              {{ t('catalog.categories.dialog.deleteWarning') }}
            </p>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            :label="t('common.actions.cancel')"
            v-close-popup
            :disable="deleteDialog.loading"
          />
          <q-btn
            unelevated
            color="negative"
            :label="t('common.actions.delete')"
            :loading="deleteDialog.loading"
            @click="confirmDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTreeNode } from 'quasar';
import type { CategoryNode, CategoryCreatePayload, CategoryUpdatePayload } from '@/types/catalog';
import { useCategoryStore } from '@/stores/catalog/useCategoryStore';
import { useNotifier } from '@/composables/useNotifier';
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';

type FormMode = 'create' | 'edit';

const categoryStore = useCategoryStore();
const { t } = useI18n();
const { error: notifyError, success: notifySuccess } = useNotifier();
const { withLoading } = useLoadingOverlay();

const formDialog = ref({
  visible: false,
  mode: 'create' as FormMode,
  loading: false,
  parentId: null as number | null,
  parentName: '' as string,
  editingId: null as number | null,
});

const form = ref({
  name: '',
  slug: '',
  isActive: true,
});

const deleteDialog = ref({
  visible: false,
  loading: false,
  targetId: null as number | null,
  targetName: '' as string,
});

const mapCategoryNodeToQTreeNode = (node: CategoryNode): QTreeNode => {
  const result: QTreeNode = {
    label: node.name,
    id: node.id,
  };

  if (node.children && node.children.length > 0) {
    result.children = node.children.map(mapCategoryNodeToQTreeNode);
  }

  return result;
};

const treeNodes = computed<QTreeNode[]>(() => categoryStore.tree.map(mapCategoryNodeToQTreeNode));

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

  const node = categoryStore.findById(id);
  categoryStore.setSelected(node);
};

const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    isActive: true,
  };
};

const openCreateRootDialog = () => {
  resetForm();
  formDialog.value = {
    visible: true,
    mode: 'create',
    parentId: null,
    parentName: '',
    editingId: null,
    loading: false,
  };
};

const openCreateChildDialog = (parentId: number) => {
  const parent = categoryStore.findById(parentId);
  resetForm();
  formDialog.value = {
    visible: true,
    mode: 'create',
    parentId,
    parentName: parent?.name ?? '',
    editingId: null,
    loading: false,
  };
};

const openEditDialog = (id: number) => {
  const node = categoryStore.findById(id);
  if (!node) return;

  form.value = {
    name: node.name,
    slug: node.slug ?? '',
    isActive: node.isActive ?? true,
  };

  formDialog.value = {
    visible: true,
    mode: 'edit',
    parentId: node.parentId ?? null,
    parentName: categoryStore.getParentName(id),
    editingId: node.id,
    loading: false,
  };
};

const openDeleteDialog = (id: number) => {
  const node = categoryStore.findById(id);
  if (!node) return;

  deleteDialog.value = {
    visible: true,
    loading: false,
    targetId: node.id,
    targetName: node.name,
  };
};

const confirmDelete = async () => {
  if (deleteDialog.value.loading || deleteDialog.value.targetId == null) return;

  deleteDialog.value.loading = true;

  try {
    await categoryStore.deleteCategory(deleteDialog.value.targetId);
    deleteDialog.value.visible = false;
    notifySuccess({ message: t('catalog.categories.notify.deleteSuccess') });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.categories.notify.deleteError');
    notifyError({ message });
  } finally {
    deleteDialog.value.loading = false;
  }
};

const submitForm = async () => {
  if (formDialog.value.loading) return;

  formDialog.value.loading = true;

  try {
    if (formDialog.value.mode === 'create') {
      const payload: CategoryCreatePayload = {
        name: form.value.name,
        ...(form.value.slug ? { slug: form.value.slug } : {}),
        parent_id: formDialog.value.parentId,
        is_active: form.value.isActive,
      };
      await categoryStore.createCategory(payload);
      notifySuccess({ message: t('catalog.categories.notify.createSuccess') });
    } else if (formDialog.value.mode === 'edit' && formDialog.value.editingId != null) {
      const payload: CategoryUpdatePayload = {
        name: form.value.name,
        ...(form.value.slug ? { slug: form.value.slug } : {}),
        parent_id: formDialog.value.parentId,
        is_active: form.value.isActive,
      };
      await categoryStore.updateCategory(formDialog.value.editingId, payload);
      notifySuccess({ message: t('catalog.categories.notify.updateSuccess') });
    }

    formDialog.value.visible = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : t('catalog.categories.notify.error');
    notifyError({ message });
  } finally {
    formDialog.value.loading = false;
  }
};

onMounted(() => {
  void loadTree();
});
</script>
