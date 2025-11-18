<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="64px" />
    </div>

    <div v-else-if="creditNote">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div class="row items-center q-gutter-md">
          <q-btn
            flat
            round
            icon="arrow_back"
            color="grey-7"
            @click="goBack"
          >
            <q-tooltip>{{ $t('ar.common.back') }}</q-tooltip>
          </q-btn>
          <div>
            <div class="text-h5">{{ creditNote.credit_note_no }}</div>
            <div class="text-subtitle2 text-grey-7">
              {{ $t('ar.credit_note.detail') }}
            </div>
          </div>
          <credit-note-status-badge :status="creditNote.status" size="lg" />
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="canIssue"
            color="positive"
            icon="check_circle"
            :label="$t('ar.credit_note.actions.issue')"
            outline
            @click="handleIssue"
          />
          <q-btn
            v-if="canCancel"
            color="negative"
            icon="cancel"
            :label="$t('ar.credit_note.actions.cancel')"
            outline
            @click="handleCancel"
          />
          <q-btn
            flat
            color="primary"
            icon="print"
            :label="$t('ar.common.print')"
            @click="handlePrint"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Left Column -->
        <div class="col-12 col-md-8">
          <!-- Credit Note Information -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.credit_note.detail') }}</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.credit_note.credit_note_no') }}</div>
                  <div class="text-body1 text-weight-medium">{{ creditNote.credit_note_no }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.status') }}</div>
                  <div class="text-body1 text-weight-medium">
                    {{ $t(`ar.credit_note.status.${creditNote.status}`) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.credit_note.issue_date') }}</div>
                  <div class="text-body1">{{ formatDate(creditNote.issue_date) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.credit_note.type') }}</div>
                  <div class="text-body1">
                    <q-chip
                      :color="getTypeColor(creditNote.type)"
                      text-color="white"
                      dense
                    >
                      {{ $t(`ar.credit_note.types.${creditNote.type}`) }}
                    </q-chip>
                  </div>
                </div>
                <div v-if="creditNote.invoice" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.invoice.title') }}</div>
                  <div class="text-body1">
                    <router-link
                      :to="{ name: 'ar-invoices-detail', params: { id: creditNote.invoice.id } }"
                      class="text-primary text-weight-medium"
                    >
                      {{ creditNote.invoice.invoice_no }}
                    </router-link>
                  </div>
                </div>
                <div v-if="creditNote.reason" class="col-12">
                  <div class="text-caption text-grey-7">{{ $t('ar.credit_note.reason') }}</div>
                  <div class="text-body1">{{ creditNote.reason }}</div>
                </div>
                <div v-if="creditNote.note" class="col-12">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.note') }}</div>
                  <div class="text-body1">{{ creditNote.note }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Customer Information -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.common.customer') }}</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.customer') }}</div>
                  <div class="text-body1 text-weight-medium">{{ creditNote.customer.name }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">รหัสลูกค้า</div>
                  <div class="text-body1">{{ creditNote.customer.code }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Column - Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.credit_note.summary') }}</div>

              <q-list dense class="q-mb-md">
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.credit_note.amount') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-bold text-h6 text-negative">
                      {{ formatCurrency(creditNote.amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator />

              <!-- Dates -->
              <div class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">
                  {{ $t('ar.credit_note.created_at') }}
                </div>
                <div class="text-body2">{{ formatDate(creditNote.created_at) }}</div>

                <div v-if="creditNote.issued_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.credit_note.issued_at') }}
                </div>
                <div v-if="creditNote.issued_at" class="text-body2">
                  {{ formatDate(creditNote.issued_at) }}
                </div>

                <div v-if="creditNote.cancelled_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.credit_note.cancelled_at') }}
                </div>
                <div v-if="creditNote.cancelled_at" class="text-body2">
                  {{ formatDate(creditNote.cancelled_at) }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="error_outline" size="64px" color="negative" />
      <div class="text-h6 q-mt-md">{{ $t('ar.credit_note.not_found') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Dialog } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CreditNote } from '@/types/ar/creditNote';
import { canIssueCreditNote, canCancelCreditNote } from '@/types/ar/creditNote';
import { formatCurrency, formatDate } from '@/types/ar/common';
import { getCreditNoteById, issueCreditNote, cancelCreditNote } from '@/services/ar/creditNoteService';
import { useNotifier } from '@/composables/useNotifier';
import CreditNoteStatusBadge from '@/components/ar/CreditNoteStatusBadge.vue';
import { CREDIT_NOTE_TYPE_COLORS } from '@/types/ar/creditNote';
import type { CreditNoteType } from '@/types/ar/creditNote';
import { printHtml, generateCreditNoteHtml } from '@/utils/print';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const creditNote = ref<CreditNote | null>(null);
const loading = ref(false);

// Computed
const creditNoteId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

const canIssue = computed(() => creditNote.value ? canIssueCreditNote(creditNote.value) : false);
const canCancel = computed(() => creditNote.value ? canCancelCreditNote(creditNote.value) : false);

const getTypeColor = (type: CreditNoteType): string => {
  return CREDIT_NOTE_TYPE_COLORS[type] || 'grey';
};

// Load credit note
const loadCreditNote = async () => {
  loading.value = true;
  try {
    creditNote.value = await getCreditNoteById(creditNoteId.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.credit_note.load_error');
    notifyError({ message });
    creditNote.value = null;
  } finally {
    loading.value = false;
  }
};

// Actions
const goBack = () => {
  void router.push({ name: 'ar-credit-notes' });
};

const handleIssue = () => {
  if (!creditNote.value) return;

  Dialog.create({
    title: t('ar.credit_note.actions.issue'),
    message: t('ar.credit_note.messages.confirm_issue'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!creditNote.value) return;
      try {
        await issueCreditNote(creditNote.value.id);
        notifySuccess({ message: t('ar.credit_note.messages.issue_success') });
        await loadCreditNote();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.credit_note.issue_error');
        notifyError({ message });
      }
    })();
  });
};

const handleCancel = () => {
  if (!creditNote.value) return;

  Dialog.create({
    title: t('ar.credit_note.actions.cancel'),
    message: t('ar.credit_note.messages.confirm_cancel'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!creditNote.value) return;
      try {
        await cancelCreditNote(creditNote.value.id);
        notifySuccess({ message: t('ar.credit_note.messages.cancel_success') });
        await loadCreditNote();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.credit_note.cancel_error');
        notifyError({ message });
      }
    })();
  });
};

const handlePrint = () => {
  if (!creditNote.value) return;
  const html = generateCreditNoteHtml(creditNote.value);
  printHtml(html, `CreditNote_${creditNote.value.credit_note_no}`);
};

onMounted(() => {
  void loadCreditNote();
});
</script>

