<script setup lang="ts">
const localePath = useLocalePath()
const { resetMatch } = useFairSingleRace()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

// 捨てるのは対局のスコアだけで、選んだゲームと対戦相手（useGameSetup）は
// 残す。同じ相手との再戦をすぐ始められるようにするため。
async function exitGame() {
  resetMatch()
  dialog.value?.close()
  await navigateTo(localePath('/games'))
}
</script>

<template>
  <button
    class="btn btn-ghost btn-sm"
    type="button"
    @click="dialog?.showModal()"
  >
    {{ $t('games.header.exit') }}
  </button>

  <dialog ref="dialog" class="modal">
    <div class="modal-box max-w-sm">
      <h2 class="text-lg font-bold">
        {{ $t('games.header.exitConfirmHeading') }}
      </h2>
      <p class="text-base-content/70 mt-2 text-sm">
        {{ $t('games.header.exitConfirmLead') }}
      </p>

      <div class="modal-action">
        <button class="btn btn-error" type="button" @click="exitGame">
          {{ $t('games.header.exitConfirm') }}
        </button>
        <form method="dialog">
          <button class="btn">{{ $t('games.header.exitCancel') }}</button>
        </form>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>{{ $t('games.header.exitCancel') }}</button>
    </form>
  </dialog>
</template>
