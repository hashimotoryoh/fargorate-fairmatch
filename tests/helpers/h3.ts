import { createApp, toWebHandler, type EventHandler } from 'h3'

export type HandlerResponse = {
  status: number
  statusMessage: string | undefined
  body: unknown
}

/**
 * Nitroのサーバールートを、h3のアプリに載せてWeb標準のRequestで叩く。
 *
 * ハンドラーを関数として直接呼ぶとイベントを自作することになり、
 * `readBody` の挙動も `createError` の応答への変換も検証できない。
 * 実際のリクエストからの経路をなるべく本番に寄せる。
 */
export async function callHandler(
  handler: EventHandler,
  body: unknown,
): Promise<HandlerResponse> {
  const app = createApp()
  app.use(handler)

  const response = await toWebHandler(app)(
    new Request('http://test.local/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

  const parsed: unknown = await response.json()

  return {
    status: response.status,
    statusMessage: (parsed as { statusMessage?: string })?.statusMessage,
    body: parsed,
  }
}
