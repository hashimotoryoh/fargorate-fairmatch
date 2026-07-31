<script setup lang="ts">
const { locale } = useI18n()

const steps = computed(() => lookupGuideScreenshots(locale.value))

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
</script>

<template>
  <button
    class="link link-primary text-sm"
    type="button"
    @click="dialog?.showModal()"
  >
    {{ $t('lookupGuide.trigger') }}
  </button>

  <dialog ref="dialog" class="modal">
    <div class="modal-box max-w-2xl">
      <h2 class="text-lg font-bold">{{ $t('lookupGuide.heading') }}</h2>
      <p class="text-base-content/70 mt-2 text-sm">
        {{ $t('lookupGuide.lead') }}
      </p>

      <!--
        手順は縦に並べる。ユーザーは片手にFargoRateアプリを開いたスマホを持って
        この画面を見るため、3手順を一望して行き来できることを優先する。
        画像は閉じている間は描画されないため、lazy 読み込みで初期表示に響かない。
      -->
      <ol class="mt-6 flex flex-col gap-8">
        <li v-for="(step, index) in steps" :key="step.src">
          <p class="mb-2 flex items-center gap-2 font-medium">
            <span class="badge badge-primary badge-sm">{{ index + 1 }}</span>
            {{ $t(`lookupGuide.steps.${step.key}.title`) }}
          </p>
          <ScreenshotFigure
            :src="step.src"
            :alt="$t(`lookupGuide.steps.${step.key}.alt`)"
            :natural-width="step.naturalWidth"
            :crop="step.crop"
            :highlight="step.highlight"
          />
        </li>
      </ol>

      <div class="modal-action">
        <form method="dialog">
          <button class="btn">{{ $t('lookupGuide.close') }}</button>
        </form>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>{{ $t('lookupGuide.close') }}</button>
    </form>
  </dialog>
</template>
