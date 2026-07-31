<script setup lang="ts">
useSeoMeta({
  title: 'FargoRateで対戦を記録する',
  description:
    'FargoRateのレーティングをもとに、ビリヤードの対戦スコアの入力と振り返りを補助するウェブアプリ。FargoRate IDだけで使い始められます。',
  ogTitle: 'FargoRate FairMatch',
  ogDescription:
    'FargoRateのレーティングをもとに、ビリヤードの対戦スコアの入力と振り返りを補助するウェブアプリ。',
})

const features = [
  {
    title: 'スコアを手元で記録する',
    description:
      '対戦中のスコアをその場で入力できます。紙やチョークに頼らず、いま何対何なのかを取り違えません。',
  },
  {
    title: '対戦成績を振り返る',
    description:
      '積み上がった対戦の結果をあとから見返せます。誰とどれくらい戦って、どう転んだのかがわかります。',
  },
  {
    title: 'FargoRateの数値をそのまま使う',
    description:
      'レーティングと信頼度をFargoRateの公式システムから取得します。自己申告ではないので、初対面同士でも実力の目安を共有できます。',
  },
]

const ratingGuide = [
  { level: '初級者', range: '100 〜 300台', note: 'カジュアルなプレイヤー' },
  {
    level: '中級者',
    range: '400 〜 500台',
    note: '一般的なアマチュアリーグプレイヤー',
  },
  { level: '上級者', range: '600台', note: 'アマチュアの上位層' },
  { level: 'プロ', range: '700台以上', note: '一流のプロと世界トッププロ' },
]
</script>

<template>
  <div class="flex flex-col gap-16 py-8">
    <section class="hero">
      <div class="hero-content flex-col gap-6 text-center">
        <AppLogo class="text-primary size-20" />

        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold sm:text-4xl">FargoRate FairMatch</h1>
          <p class="text-base-content/80 mx-auto max-w-xl">
            FargoRateを用いたビリヤード対戦を補助するウェブアプリです。対戦中のスコアの入力や、対戦成績の振り返りを手助けします。
          </p>
        </div>

        <NuxtLink to="/lookup" class="btn btn-primary btn-lg">
          FargoRate IDで始める
        </NuxtLink>
      </div>
    </section>

    <section class="flex flex-col gap-6">
      <h2 class="text-center text-2xl font-bold">できること</h2>

      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="card bg-base-200"
        >
          <div class="card-body gap-2">
            <h3 class="card-title text-base">{{ feature.title }}</h3>
            <p class="text-base-content/70 text-sm">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-2 text-center">
        <h2 class="text-2xl font-bold">FargoRateとは</h2>
        <p class="text-base-content/80 mx-auto max-w-2xl text-sm">
          世界中のポケットビリヤードプレイヤーの強さを、同じ基準で数値化して表すレーティングシステムです。対戦の勝敗と得点差を積み上げて算出されるため、国や地域、リーグをまたいでも同じ尺度で強さを比べられます。提携しているリーグや大会の結果が送られると自動で更新されます。
        </p>
      </div>

      <div class="mx-auto w-full max-w-xl overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>目安</th>
              <th>レーティング</th>
              <th class="hidden sm:table-cell">対象</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ratingGuide" :key="row.level">
              <th>{{ row.level }}</th>
              <td>{{ row.range }}</td>
              <td class="text-base-content/70 hidden text-sm sm:table-cell">
                {{ row.note }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="flex flex-col items-center gap-4 text-center">
      <h2 class="text-2xl font-bold">はじめかた</h2>
      <p class="text-base-content/80 max-w-xl text-sm">
        FargoRateアプリのプレイヤーカードに表示される13桁のFargoRate
        IDを入力するだけです。パスワードの登録は要りません。IDの調べ方は入力画面で案内します。
      </p>
      <p class="text-base-content/60 max-w-xl text-xs">
        このアプリはFargoRateからレーティングを取得しますが、対戦結果を公式システムへ送信することはありません。ここでの記録によってあなたのレーティングが変わることはありません。
      </p>
      <NuxtLink to="/lookup" class="btn btn-primary">
        FargoRate IDで始める
      </NuxtLink>
    </section>
  </div>
</template>
