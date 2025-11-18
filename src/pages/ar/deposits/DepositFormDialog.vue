<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card>
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h5">
          {{ isEditMode ? $t('ar.deposit.edit') : $t('ar.deposit.create') }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleCancel" />
      </q-card-section>

      <q-separator />

      <!-- Form Content -->
      <q-card-section class="scroll" style="max-height: calc(100vh - 150px)">
        <q-form ref="formRef" @submit="handleSubmit">
          <div class="row q-col-gutter-md">
            <!-- Customer Selection -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    {{ $t('ar.common.customer') }}
                  </div>
                  <q-select
                    v-model="form.customer_id"
                    :options="customerOptions"
                    :label="$t('ar.common.customer')"
                    option-value="id"
                    option-label="name"
                    emit-value
                    map-options
                    outlined
                    use-input
                    input-debounce="300"
                    :loading="loadingCustomers"
                    :rules="[
                      (val) => !!val || $t('ar.validation.must_select_customer'),
                    ]"
                    @filter="filterCustomers"
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          {{ $t('ar.common.no_results') }}
                        </q-item-section>
                      </q-item>
                    </template>

                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt.name }}</q-item-label>
                          <q-item-label caption>{{ scope.opt.code }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </q-card-section>
              </q-card>
            </div>

            <!-- Deposit Details -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    {{ $t('ar.deposit.detail') }}
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.deposit_date"
                        :label="$t('ar.deposit.deposit_date')"
                        type="date"
                        outlined
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model.number="form.amount"
                        :label="$t('ar.deposit.amount')"
                        type="number"
                        step="0.01"
                        min="0"
                        outlined
                        :rules="[
                          (val) => !!val || $t('ar.validation.required'),
                          (val) => val > 0 || $t('ar.validation.invalid_amount'),
                        ]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.payment_method"
                        :options="paymentMethodOptions"
                        :label="$t('ar.deposit.payment_method')"
                        emit-value
                        map-options
                        outlined
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.payment_ref"
                        :label="$t('ar.deposit.payment_ref')"
                        outlined
                        clearable
                      />
                    </div>

                    <div class="col-12">
                      <q-input
                        v-model="form.note"
                        :label="$t('ar.common.note')"
                        type="textarea"
                        outlined
                        rows="3"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <!-- Footer Actions -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          :label="$t('ar.common.cancel')"
          color="grey-7"
          @click="handleCancel"
        />
        <q-btn
          unelevated
          :label="$t('ar.common.save')"
          color="primary"
          :loading="saving"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CustomerDeposit, DepositPayload } from '@/types/ar/deposit';
import { createDeposit, updateDeposit } from '@/services/ar/depositService';
import { useNotifier } from '@/composables/useNotifier';

interface CustomerOption {
  id: number;
  code: string;
  name: string;
}

interface Props {
  modelValue: boolean;
  deposit?: CustomerDeposit | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  deposit: null,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// Refs
const formRef = ref<QForm>();
const saving = ref(false);
const loadingCustomers = ref(false);

const getTodayDateString = (): string => {
  return new Date().toISOString().slice(0, 10);
};

// Form state
const form = ref<DepositPayload>({
  customer_id: 0,
  deposit_date: getTodayDateString(),
  amount: 0,
  payment_method: 'cash',
  payment_ref: null,
  note: null,
});

// Mock data - In production, these should come from API
const customerOptions = ref<CustomerOption[]>([
  { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
  { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
  { id: 3, code: 'C003', name: 'ร้าน DEF' },
]);

const paymentMethodOptions = computed(() => [
  { label: t('ar.receipt.payment_methods.cash'), value: 'cash' },
  { label: t('ar.receipt.payment_methods.bank_transfer'), value: 'bank_transfer' },
  { label: t('ar.receipt.payment_methods.cheque'), value: 'cheque' },
  { label: t('ar.receipt.payment_methods.credit_card'), value: 'credit_card' },
  { label: t('ar.receipt.payment_methods.promissory_note'), value: 'promissory_note' },
]);

// Computed
const isEditMode = computed(() => !!props.deposit);

// Methods
const resetForm = () => {
  form.value = {
    customer_id: 0,
    deposit_date: getTodayDateString(),
    amount: 0,
    payment_method: 'cash',
    payment_ref: null,
    note: null,
  };
};

// Watch for deposit changes (edit mode)
watch(
  () => props.deposit,
  (newDeposit) => {
    if (newDeposit) {
      form.value = {
        customer_id: newDeposit.customer.id,
        deposit_date: newDeposit.deposit_date,
        amount: parseFloat(newDeposit.amount),
        payment_method: newDeposit.payment_method,
        payment_ref: newDeposit.payment_ref,
        note: newDeposit.note,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

const filterCustomers = (val: string, update: (fn: () => void) => void) => {
  // In production, this should call an API to search customers
  update(() => {
    if (val === '') {
      customerOptions.value = [
        { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
        { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
        { id: 3, code: 'C003', name: 'ร้าน DEF' },
      ];
    } else {
      const needle = val.toLowerCase();
      customerOptions.value = [
        { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
        { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
        { id: 3, code: 'C003', name: 'ร้าน DEF' },
      ].filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.code.toLowerCase().includes(needle),
      );
    }
  });
};

const handleSubmit = async () => {
  // Validate form
  const formValid = await formRef.value?.validate();

  if (!formValid) {
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value && props.deposit) {
      // Update existing deposit
      await updateDeposit(props.deposit.id, form.value);
      notifySuccess({ message: t('ar.deposit.messages.update_success') });
    } else {
      // Create new deposit
      await createDeposit(form.value);
      notifySuccess({ message: t('ar.deposit.messages.create_success') });
    }

    emit('saved');
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : isEditMode.value
          ? t('ar.deposit.update_error')
          : t('ar.deposit.create_error');
    notifyError({ message });
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit('update:modelValue', false);
  resetForm();
};
</script>

<style scoped lang="scss">
:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(4px);
}
</style>

