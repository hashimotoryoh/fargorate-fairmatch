<script setup lang="ts">
const { labelKey, headingKey, leadKey } = defineProps<{
  /** ヘッダーに出すボタンの文言。ブリーフィングは「終了」、プレイ中は「中断」。 */
  labelKey: string
  headingKey: string
  leadKey: string
}>()

// 破棄する範囲と戻り先はページごとに違うため、確定の処理は呼び出し側が持つ。
const emit = defineEmits<{ confirm: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

function confirm() {
  dialog.value?.close()
  emit('confirm')
}
</script>

<template>
  <button
    class="btn btn-ghost btn-sm text-error"
    type="button"
    @click="dialog?.showModal()"
  >
    {{ $t(labelKey) }}
  </button>

  <dialog ref="dialog" class="modal">
    <div class="modal-box max-w-sm">
      <h2 class="text-lg font-bold">{{ $t(headingKey) }}</h2>
      <p class="text-base-content/70 mt-2 text-sm">{{ $t(leadKey) }}</p>

      <div class="modal-action">
        <button class="btn btn-error" type="button" @click="confirm">
          {{ $t('games.header.confirm') }}
        </button>
        <form method="dialog">
          <button class="btn">{{ $t('games.header.cancel') }}</button>
        </form>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>{{ $t('games.header.cancel') }}</button>
    </form>
  </dialog>
</template>
