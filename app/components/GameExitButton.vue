<script setup lang="ts">
import type { ConfirmDialog } from '#components'

const { headingKey, leadKey } = defineProps<{
  /** 確認ダイアログの文言。ブリーフィングとプレイ中で破棄する範囲が違う。 */
  headingKey: string
  leadKey: string
}>()

// 破棄する範囲と戻り先はページごとに違うため、確定の処理は呼び出し側が持つ。
const emit = defineEmits<{ confirm: [] }>()

const dialog = useTemplateRef<InstanceType<typeof ConfirmDialog>>('dialog')
</script>

<template>
  <button
    class="btn btn-ghost btn-sm text-error"
    type="button"
    @click="dialog?.showModal()"
  >
    {{ $t('games.header.quit') }}
  </button>

  <ConfirmDialog
    ref="dialog"
    :heading-key="headingKey"
    :lead-key="leadKey"
    confirm-key="games.header.confirm"
    cancel-key="games.header.cancel"
    @confirm="emit('confirm')"
  />
</template>
