import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { registerUninstallFeedback, UNINSTALL_URL } from '../src/lib/support'

const root = resolve(__dirname, '..')
describe('optional uninstall feedback', () => {
  it('registers the static URL without identifiers and tolerates unavailable APIs', async () => {
    const setUninstallURL = vi.fn(async () => {})
    vi.stubGlobal('chrome', { runtime: { setUninstallURL } })
    await registerUninstallFeedback()
    expect(setUninstallURL).toHaveBeenCalledWith(UNINSTALL_URL)
    expect(new URL(UNINSTALL_URL).search).toBe('')
    vi.stubGlobal('chrome', { runtime: {} })
    await expect(registerUninstallFeedback()).resolves.toBeUndefined()
  })

  it('keeps choices local and builds a public GitHub draft only for an explicit link', () => {
    const dom = new JSDOM(readFileSync(resolve(root, 'uninstall.html'), 'utf8'), { runScripts: 'outside-only', url: UNINSTALL_URL })
    const network = vi.fn()
    dom.window.fetch = network
    dom.window.eval(readFileSync(resolve(root, 'uninstall.js'), 'utf8'))
    const document = dom.window.document
    const choice = document.querySelector<HTMLInputElement>('input')!
    choice.checked = true
    choice.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    const notes = document.querySelector<HTMLTextAreaElement>('#notes')!
    notes.value = 'Please fix code formatting & spacing'
    notes.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    const url = new URL(document.querySelector<HTMLAnchorElement>('#send')!.href)
    expect(url.origin).toBe('https://github.com')
    expect(url.searchParams.get('body')).toContain('Export failed or content was missing')
    expect(url.searchParams.get('body')).toContain(notes.value)
    const email = new URL(document.querySelector<HTMLAnchorElement>('#email-send')!.href)
    expect(email.protocol).toBe('mailto:')
    expect(email.pathname).toBe('extensions@pengyuhao.com')
    expect(email.searchParams.get('body')).toContain(notes.value)
    expect(email.searchParams.get('body')).toContain('Export failed or content was missing')
    expect(network).not.toHaveBeenCalled()
    expect(dom.window.localStorage.length).toBe(0)
    const language = document.querySelector<HTMLSelectElement>('#language')!
    language.value = 'zh'
    language.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.body.textContent).toContain('需要 GitHub 账号')
    expect(notes.value).toContain('Please fix')
    dom.window.close()
  })

  it('uses one UI font for titles, body and controls, leaving code separate', () => {
    const css = readFileSync(resolve(root, 'src/styles/popup.css'), 'utf8')
    expect(css).toContain("@import '../../typography.css'")
    const typography = readFileSync(resolve(root, 'typography.css'), 'utf8')
    expect(typography).toContain('--font-display: var(--font-stack)')
    expect(typography).toContain('"Iowan Old Style"')
    expect(typography).toContain('"Songti SC"')
    expect(typography).toContain('"Hiragino Mincho ProN"')
    expect(typography).toContain('"AppleMyungjo"')
    expect(css).toContain('button, input, select, textarea { font-family: inherit; }')
    expect(css).not.toContain('font-family: var(--font-mono)')
    expect(readFileSync(resolve(root, 'src/styles/options.css'), 'utf8')).not.toContain('font-family: var(--font-mono)')
  })
})
