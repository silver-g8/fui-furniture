import { ref } from 'vue';
import { useNotifier } from './useNotifier';

interface CrudFormOptions<TPayload, TResult> {
  submit: (payload: TPayload) => Promise<TResult>;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

export const useCrudForm = <TPayload, TResult>({
  submit,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: CrudFormOptions<TPayload, TResult>) => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { success, error: notifyError } = useNotifier();

  const execute = async (payload: TPayload) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await submit(payload);

      if (successMessage) {
        success({ message: successMessage });
      }

      if (onSuccess) {
        await onSuccess(result);
      }

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : errorMessage ?? 'Operation failed. Please try again.';

      error.value = message;
      notifyError({ message });

      if (onError) {
        await onError(err);
      }

      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    execute,
    loading,
    error,
  };
};

