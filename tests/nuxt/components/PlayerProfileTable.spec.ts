import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PlayerProfileTable from '../../../app/components/PlayerProfileTable.vue'
import { createGuestPlayer, createPlayerProfile } from '../../helpers/fixtures'
import { jaMessage } from '../../helpers/i18n'

describe('PlayerProfileTable', () => {
  it('レーティングと信頼度を独立した数値として見せる', async () => {
    const component = await mountSuspended(PlayerProfileTable, {
      props: { player: createPlayerProfile() },
    })
    const values = component.findAll('.stat-value').map((node) => node.text())

    expect(component.text()).toContain(jaMessage('player.rating'))
    expect(component.text()).toContain(jaMessage('player.robustness'))
    expect(values).toEqual(['523', '412'])
  })

  it('名前を1つの行で見せる', async () => {
    const component = await mountSuspended(PlayerProfileTable, {
      props: { player: createPlayerProfile({ name: 'Hanako Suzuki' }) },
    })

    expect(component.find('tbody').text()).toContain('Hanako Suzuki')
  })

  it('リーグ・リージョン・チームを見せる', async () => {
    const component = await mountSuspended(PlayerProfileTable, {
      props: { player: createPlayerProfile() },
    })
    const rows = component.findAll('tbody tr').map((row) => row.text())

    expect(rows).toHaveLength(4)
    expect(rows.join('\n')).toContain('Tokyo League')
    expect(rows.join('\n')).toContain('Kanto')
    expect(rows.join('\n')).toContain('Team Alpha')
  })

  // 外部APIは任意項目を null で返しうる。空欄のままだと行の意味が伝わらない。
  it('値が null の項目をハイフンで見せる', async () => {
    const component = await mountSuspended(PlayerProfileTable, {
      props: {
        player: createPlayerProfile({
          leagueName: null,
          region: null,
          teamNames: null,
        }),
      },
    })
    const values = component.findAll('tbody td').map((cell) => cell.text())

    expect(values).toEqual(['Taro Yamada', '-', '-', '-'])
  })

  // 確認画面ではユーザーが今まさに入力したIDなので出さない。
  it('既定ではFargoRate IDを出さない', async () => {
    const component = await mountSuspended(PlayerProfileTable, {
      props: { player: createPlayerProfile() },
    })

    expect(component.text()).not.toContain(jaMessage('player.fargorateId'))
    expect(component.text()).not.toContain('9900001234567')
  })

  it('show-fargorate-id を付けるとFargoRate IDを先頭の行に出す', async () => {
    const component = await mountSuspended(PlayerProfileTable, {
      props: { player: createPlayerProfile(), showFargorateId: true },
    })
    const rows = component.findAll('tbody tr')

    expect(rows).toHaveLength(5)
    expect(rows[0]?.text()).toContain(jaMessage('player.fargorateId'))
    expect(rows[0]?.text()).toContain('9900001234567')
  })

  describe('ゲスト', () => {
    // 自己申告のレーティングには信頼度が無い。空欄では伝わらないため明示する。
    it('信頼度を None として見せる', async () => {
      const component = await mountSuspended(PlayerProfileTable, {
        props: { player: createGuestPlayer() },
      })
      const values = component.findAll('.stat-value').map((node) => node.text())

      expect(values).toEqual(['450', jaMessage('player.robustnessNone')])
    })

    // 持っていない項目を空欄で並べても読み手に伝わるものが無い。
    it('FargoRate固有の項目を行ごと出さない', async () => {
      const component = await mountSuspended(PlayerProfileTable, {
        props: { player: createGuestPlayer(), showFargorateId: true },
      })
      const rows = component.findAll('tbody tr')

      expect(rows).toHaveLength(1)
      expect(rows[0]?.text()).toContain('Jiro Suzuki')
      expect(component.text()).not.toContain(jaMessage('player.fargorateId'))
      expect(component.text()).not.toContain(jaMessage('player.league'))
    })

    // 既定名は言語で変わるため、セッションではなく描画時に補う。
    it('名前が未入力なら既定名で見せる', async () => {
      const component = await mountSuspended(PlayerProfileTable, {
        props: { player: createGuestPlayer({ name: null }) },
      })

      expect(component.find('tbody').text()).toContain(
        jaMessage('player.guestName'),
      )
    })
  })
})
