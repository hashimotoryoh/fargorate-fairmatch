import { lstatSync, readFileSync, readlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import packageJson from '../../../package.json' with { type: 'json' }

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))

function read(path: string): string {
  return readFileSync(new URL(path, `file://${ROOT}`), 'utf8')
}

/**
 * エージェント向けのガイドは実体を `AGENTS.md` 一つに保ち、他はシンボリック
 * リンクにする。実体が複製されると、片方だけが更新されて食い違う。
 */
describe('エージェント向けガイド', () => {
  it.each([
    ['CLAUDE.md', 'AGENTS.md'],
    ['.github/copilot-instructions.md', '../AGENTS.md'],
  ])('%s が %s へのシンボリックリンクである', (path, target) => {
    const stats = lstatSync(new URL(path, `file://${ROOT}`))

    expect(stats.isSymbolicLink()).toBe(true)
    expect(readlinkSync(new URL(path, `file://${ROOT}`))).toBe(target)
  })
})

/**
 * ライセンスの表記は2か所に散っている。どちらか一方だけを変えると食い違う
 * ため、揃っていることを確かめる。フッターのLegal欄は `LICENSE` へリンク
 * するだけで、ライセンス名は持たない。
 */
describe('ライセンスの表記', () => {
  it('package.json と LICENSE の表記が揃っている', () => {
    expect(packageJson.license).toBe('MIT')
    expect(read('LICENSE')).toContain('MIT License')
  })
})

/**
 * 全角スペースはインデントや単語の区切りに使わない。見た目では気づきにくく、
 * 差分にも表れにくいため、機械的に弾く。
 */
describe('文書の表記', () => {
  it.each(['README.md', 'AGENTS.md'])('%s に全角スペースを含まない', (path) => {
    expect(read(path)).not.toContain('　')
  })
})
