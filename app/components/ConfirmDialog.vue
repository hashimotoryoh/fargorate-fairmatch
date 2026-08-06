<script setup lang="ts">
const { headingKey, leadKey, confirmKey, cancelKey } = defineProps<{
  /** 確認ダイアログの見出し・リード文・確定ボタン・キャンセルボタンの翻訳キー。 */
  headingKey: string
  leadKey: string
  confirmKey: string
  cancelKey: string
}>()

// 確定後に何をするかは呼び出し側ごとに違うため、処理は持たずemitだけする。
const emit = defineEmits<{ confirm: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

function confirm() {
  dialog.value?.close()
  emit('confirm')
}

// 開くきっかけ（トリガー）は呼び出し側ごとに見た目が異なるため持たず、
// 開閉だけをこのコンポーネントの外から呼べるようにする。
defineExpose({
  showModal: () => dialog.value?.showModal(),
})
</script>

<template>
  <dialog ref="dialog" class="modal">
    <div class="modal-box max-w-sm">
      <h2 class="text-lg font-bold">{{ $t(headingKey) }}</h2>
      <p class="text-base-content/70 mt-2 text-sm">{{ $t(leadKey) }}</p>

      <div class="modal-action">
        <button class="btn btn-error" type="button" @click="confirm">
          {{ $t(confirmKey) }}
        </button>
        <form method="dialog">
          <button class="btn">{{ $t(cancelKey) }}</button>
        </form>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>{{ $t(cancelKey) }}</button>
    </form>
  </dialog>
</template>
