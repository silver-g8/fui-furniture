<template>
  <q-form ref="formRef" @submit.prevent="handleSubmit">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.name"
          :label="t('catalog.products.fields.name')"
          :rules="[requiredRule]"
          :disable="loading"
          outlined
          dense
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.sku"
          :label="t('catalog.products.fields.sku')"
          :rules="[requiredRule]"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-select
          v-model="formState.status"
          :options="statusOptions"
          emit-value
          map-options
          :label="t('catalog.products.fields.status')"
          :rules="[requiredRule]"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-select
          v-model="formState.categoryId"
          :label="t('catalog.products.fields.category')"
          :options="categoryOptions"
          emit-value
          map-options
          :rules="[requiredRule]"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-select
          v-model="formState.brandId"
          :label="t('catalog.products.fields.brand')"
          :options="brandOptions"
          emit-value
          map-options
          clearable
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model.number="formState.price"
          type="number"
          :label="t('catalog.products.fields.price')"
          :rules="[requiredNumberRule]"
          :disable="loading"
          outlined
          dense
          min="0"
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model.number="formState.cost"
          type="number"
          :label="t('catalog.products.fields.cost')"
          :disable="loading"
          outlined
          dense
          min="0"
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model.number="formState.onHand"
          type="number"
          :label="t('catalog.products.fields.onHand')"
          :rules="[requiredNumberRule]"
          :disable="loading"
          outlined
          dense
          min="0"
          step="1"
        />
      </div>

      <div class="col-12">
        <div class="q-mb-md">
          <div v-if="formState.imageUrl" class="q-mb-md">
            <q-img
              :src="formState.imageUrl"
              :alt="t('catalog.products.fields.imageUrl')"
              style="max-width: 300px; max-height: 300px"
              fit="contain"
              data-test="image-preview"
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-negative text-white">
                  {{ t('catalog.products.errors.imageLoadError') }}
                </div>
              </template>
            </q-img>
          </div>
          <q-file
            v-model="imageFile"
            :label="t('catalog.products.fields.imageUrl')"
            accept="image/jpeg,image/png,image/webp"
            max-file-size="2048000"
            :disable="loading || uploadingImage"
            outlined
            dense
            clearable
            @update:model-value="handleImageUpload"
            data-test="file-input"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
          <div v-if="productId && formState.imageUrl" class="q-mt-sm">
            <q-btn
              color="negative"
              icon="delete"
              :label="t('catalog.products.actions.deleteImage')"
              :disable="loading || deletingImage"
              :loading="deletingImage"
              size="sm"
              @click="handleImageDelete"
              data-test="delete-image"
            />
          </div>
          <div v-if="uploadError" class="q-mt-xs text-negative text-caption">
            {{ uploadError }}
          </div>
        </div>
      </div>

      <div class="col-12">
        <q-input
          v-model="formState.description"
          type="textarea"
          autogrow
          :label="t('catalog.products.fields.description')"
          :disable="loading"
          outlined
          dense
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-lg">
      <div class="col-12 col-md-6">
        <q-btn
          color="primary"
          :label="t('catalog.products.actions.submit')"
          type="submit"
          :loading="loading"
        />
        <q-btn
          flat
          color="primary"
          :label="t('catalog.products.actions.cancel')"
          class="q-ml-sm"
          :disable="loading"
          @click="emit('cancel')"
        />
      </div>
    </div>
  </q-form>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { ProductPayload, ProductStatus } from '@/types/catalog';
import { useNotifier } from '@/composables/useNotifier';
import { uploadProductImage, deleteProductImage } from '@/services/catalog/product.service';

interface Option {
  label: string;
  value: number | string;
}

interface ProductFormState extends ProductPayload {
  brandId: number | null;
  categoryId: number | null;
}

const defaultState = (): ProductFormState => ({
  sku: '',
  name: '',
  description: null,
  status: 'draft',
  price: 0,
  cost: null,
  brandId: null,
  categoryId: null,
  onHand: 0,
  imageUrl: null,
});

const props = withDefaults(
  defineProps<{
    modelValue?: Partial<ProductPayload>;
    loading?: boolean;
    brandOptions?: Option[];
    categoryOptions?: Option[];
    productId?: number;
  }>(),
  {
    modelValue: () => ({}),
    loading: false,
    brandOptions: () => [],
    categoryOptions: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProductPayload): void;
  (e: 'submit', value: ProductPayload): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();
const formRef = ref<QForm>();
const imageFile = ref<File | null>(null);
const uploadingImage = ref(false);
const deletingImage = ref(false);
const uploadError = ref<string | null>(null);
const formState = reactive<ProductFormState>({
  ...defaultState(),
  ...props.modelValue,
  brandId: (props.modelValue?.brandId as number | undefined) ?? null,
  categoryId: (props.modelValue?.categoryId as number | undefined) ?? null,
  description: props.modelValue?.description ?? null,
  cost: props.modelValue?.cost ?? null,
  price: props.modelValue?.price ?? 0,
  onHand: props.modelValue?.onHand ?? 0,
  imageUrl: props.modelValue?.imageUrl ?? null,
});

const statusOptions = computed(() =>
  (['draft', 'active', 'inactive', 'archived'] as ProductStatus[]).map((value) => ({
    label: t(`catalog.products.status.${value}`),
    value,
  })),
);

const requiredRule = (value: string | number | null | undefined) =>
  (value !== null && value !== undefined && `${value}`.length > 0) ||
  t('catalog.validation.required');

const requiredNumberRule = (value: number | null | undefined) =>
  (value !== null && value !== undefined && !Number.isNaN(value)) ||
  t('catalog.validation.required');

watch(
  () => props.modelValue,
  (incoming) => {
    if (!incoming) {
      Object.assign(formState, defaultState());
      return;
    }
    Object.assign(formState, {
      ...defaultState(),
      ...incoming,
      brandId: (incoming.brandId as number | undefined) ?? null,
      categoryId: (incoming.categoryId as number | undefined) ?? null,
      description: incoming.description ?? null,
      cost: incoming.cost ?? null,
      price: incoming.price ?? 0,
      onHand: incoming.onHand ?? 0,
      imageUrl: incoming.imageUrl ?? null,
    });
  },
  { deep: true, immediate: true },
);

const syncModel = () => {
  const imageUrl = formState.imageUrl?.trim();
  const parsedOnHand = Number(formState.onHand);
  const safeOnHand =
    Number.isFinite(parsedOnHand) && parsedOnHand >= 0 ? Math.floor(parsedOnHand) : 0;
  const parsedPrice = Number(formState.price);
  const safePrice = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
  const parsedCost =
    formState.cost !== null && formState.cost !== undefined ? Number(formState.cost) : null;
  const safeCost =
    parsedCost !== null && Number.isFinite(parsedCost) && parsedCost >= 0 ? parsedCost : null;

  const payload: ProductPayload = {
    sku: formState.sku,
    name: formState.name,
    description: formState.description ?? null,
    status: formState.status,
    price: safePrice,
    cost: safeCost,
    brandId:
      typeof formState.brandId === 'number' && Number.isFinite(formState.brandId)
        ? formState.brandId
        : null,
    categoryId:
      typeof formState.categoryId === 'number' && Number.isFinite(formState.categoryId)
        ? formState.categoryId
        : null,
    onHand: safeOnHand,
    imageUrl: imageUrl && imageUrl.length ? imageUrl : null,
  };
  emit('update:modelValue', payload);
  return payload;
};

watch(
  formState,
  () => {
    syncModel();
  },
  { deep: true },
);

const handleImageUpload = async (files: File | File[] | null) => {
  uploadError.value = null;

  if (!files || (Array.isArray(files) && files.length === 0)) {
    return;
  }

  const file = Array.isArray(files) ? files[0] : files;

  // Validate file exists
  if (!file) {
    return;
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = t('catalog.products.errors.invalidImageType');
    imageFile.value = null;
    return;
  }

  // Validate file size (2MB = 2048000 bytes)
  const maxSize = 2048000;
  if (file.size > maxSize) {
    uploadError.value = t('catalog.products.errors.imageTooLarge');
    imageFile.value = null;
    return;
  }

  // Only upload if we have a productId (edit mode)
  if (!props.productId) {
    // In create mode, just store the file for later upload after product creation
    // For now, we'll show an error
    uploadError.value = t('catalog.products.errors.imageUploadRequiresProduct');
    imageFile.value = null;
    return;
  }

  uploadingImage.value = true;

  try {
    const updatedProduct = await uploadProductImage(props.productId, file);
    formState.imageUrl = updatedProduct.imageUrl;
    notifySuccess({ message: t('catalog.products.notify.imageUploadSuccess') });
    imageFile.value = null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.products.errors.imageUploadFailed');
    uploadError.value = message;
    notifyError({ message });
  } finally {
    uploadingImage.value = false;
  }
};

const handleImageDelete = async () => {
  if (!props.productId || !formState.imageUrl) {
    return;
  }

  deletingImage.value = true;

  try {
    await deleteProductImage(props.productId);
    formState.imageUrl = null;
    notifySuccess({ message: t('catalog.products.notify.imageDeleteSuccess') });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.products.errors.imageDeleteFailed');
    notifyError({ message });
  } finally {
    deletingImage.value = false;
  }
};

const handleSubmit = async () => {
  const form = formRef.value;
  if (!form) {
    return;
  }

  const valid = await form.validate();
  if (!valid) {
    return;
  }

  emit('submit', syncModel());
};
</script>
