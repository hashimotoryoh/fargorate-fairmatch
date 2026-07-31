import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

/**
 * テストは2つのプロジェクトに分かれている。
 *
 * - `unit`: Nuxtのランタイムを要さない素のNode環境。純粋なロジックと、
 *   Nitroのサーバールートをh3のハンドラーとして直接叩く機能テストを置く
 * - `nuxt`: Nuxtのランタイムを立ち上げる環境。コンポーネントやページの
 *   描画・操作を確かめるUIテストを置く。起動が重いため必要なものだけに絞る
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.spec.ts'],
          setupFiles: ['tests/setup/nitro-auto-imports.ts'],
          // 各テストが vi.stubGlobal で差し替えたグローバルを自動で戻す。
          // サーバー側の自動インポートをグローバルで模しているため、
          // 戻し忘れがそのまま他のテストへ漏れる。
          unstubGlobals: true,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['tests/nuxt/**/*.spec.ts'],
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
            },
          },
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: ['app/**', 'server/**', 'shared/**'],
      reporter: ['text', 'html'],
    },
  },
})
