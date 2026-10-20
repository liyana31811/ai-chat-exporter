/* Optional feedback only: no network, storage, analytics, or extension data. */
(() => {
  const english = Object.fromEntries([...document.querySelectorAll('[data-text]')].map(el => [el.dataset.text, el.textContent]))
  const chinese = {
    title: '谢谢你试用 AI Chat Exporter。', intro: '如果你已卸载，愿意告诉我们原因吗？完全自愿，也可以直接关闭此页。',
    reason: '为什么卸载？（可选，可多选）', broken: '导出失败或内容不完整', format: '导出格式不符合预期', feature: '缺少需要的平台或功能', usability: '不容易使用', need: '暂时不需要', other: '其他', details: '还有什么想告诉我们？（选填）',
    privacy: '不会自动发送。邮件按钮会在邮件应用中打开草稿，请确认后发送；GitHub 反馈内容公开且需要 GitHub 账号。请勿填写私人聊天、密码或令牌。',
    email: '通过邮件发送反馈', emailHelp: '没有配置邮件应用？复制此地址给我们发邮件：',
    send: '改用 GitHub 反馈', draft: '在你点击链接前，选择和文字只留在当前页面。不追踪，不自动提交。', help: '需要帮助？', support: '不需要 GitHub 账号也可以通过邮件联系我们；也可使用 GitHub Issues 报告问题、提出疑问和关注修复进展。', open: '到 GitHub 获取帮助 →', policy: '隐私政策',
  }
  const language = document.getElementById('language')
  language.value = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  function refresh() {
    const zh = language.value === 'zh'
    document.documentElement.lang = zh ? 'zh-CN' : 'en'
    document.querySelectorAll('[data-text]').forEach(el => { el.textContent = (zh ? chinese : english)[el.dataset.text] })
    const reasons = [...document.querySelectorAll('input:checked')].map(el => '- ' + el.value)
    const notes = document.getElementById('notes').value.trim()
    const url = new URL('https://github.com/pinguarmy/ai-chat-exporter/issues/new')
    url.searchParams.set('title', '[Feedback] Uninstall feedback')
    const body = ['## Reasons', reasons.join('\n') || '(Not specified)', '', '## Additional feedback', notes || '(None)', '', 'Submitted voluntarily from the uninstall feedback page.'].join('\n')
    url.searchParams.set('body', body)
    document.getElementById('send').href = url.href
    document.getElementById('email-send').href = 'mailto:extensions@pengyuhao.com?subject=' + encodeURIComponent('AI Chat Exporter — Feedback') + '&body=' + encodeURIComponent(body)
  }
  document.addEventListener('change', refresh)
  document.getElementById('notes').addEventListener('input', refresh)
  refresh()
})()
