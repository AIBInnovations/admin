import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export const LOOKUP_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1UEQWQwxi__qgAkcp_rKT3EfPmVtd-bJHo1T0azX3g_4/edit'

export default function LookupGoogleSheet() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [script, setScript] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    let loading = false
    async function load() {
      if (loading || document.hidden) return
      loading = true
      try {
        const result = await api.lookupSheet()
        if (active) { setStatus(result); setError('') }
      } catch (e) { if (active) setError(e.message || 'Could not check Google Sheets connection') }
      finally { loading = false }
    }
    load()
    const timer = setInterval(load, 30000)
    document.addEventListener('visibilitychange', load)
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', load) }
  }, [])

  async function setup() {
    if (status?.configured && !window.confirm('Generate a replacement setup script? The previous script will stop syncing until you install this replacement.')) return
    setBusy(true)
    setError('')
    setCopied(false)
    try {
      const result = await api.setupLookupSheet()
      setScript(result.script)
      setStatus({ configured: true, lastSyncedAt: null })
    } catch (e) { setError(e.message || 'Could not generate setup code') }
    finally { setBusy(false) }
  }

  async function copyScript() {
    try { await navigator.clipboard.writeText(script); setCopied(true) }
    catch { setError('Select the setup code below and copy it manually.') }
  }

  const recent = status?.lastSyncedAt && Date.now() - new Date(status.lastSyncedAt).getTime() < 3 * 60000
  return <section className="card" style={{ padding: 20, marginBottom: 20 }}>
    <div className="row items-center gap-12" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div><h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Live Google Sheet</h2>
        <p style={{ margin: 0 }}>Bookmark this sheet. Once connected, it updates about every minute without downloads.</p></div>
      <a className="btn btn-primary" href={LOOKUP_SHEET_URL} target="_blank" rel="noopener noreferrer">Open Google Sheet</a>
    </div>
    <p role="status" style={{ margin: '12px 0' }}>
      {!status ? 'Checking connection...' : status.lastSyncedAt
        ? `${recent && !status.error ? 'Sync active' : 'Sync needs attention'} — last successful update: ${new Date(status.lastSyncedAt).toLocaleString()} (${status.rowCount || 0} creators).`
        : 'One-time Google authorization required. The sheet is not syncing yet.'}
    </p>
    {(error || status?.error) && <p role="alert" style={{ color: 'var(--red, #b91c1c)' }}>{error || status.error}</p>}
    <details open={script ? true : undefined}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>One-time setup</summary>
      <ol style={{ lineHeight: 1.9, paddingLeft: 22 }}>
        <li>Click Generate setup code below.</li>
        <li>Open the Google Sheet, then choose <strong>Extensions → Apps Script</strong>.</li>
        <li>Replace the default code with the copied code and save.</li>
        <li>Select <strong>startAutoUpdate</strong>, click <strong>Run</strong> and authorize your Google account once.</li>
      </ol>
      <p>The Creators tab is managed by the sync. Keep the setup code private; use other tabs for your own notes.</p>
      <button type="button" className="btn" disabled={busy || !status} onClick={setup}>{busy ? 'Preparing...' : status?.configured ? 'Generate replacement setup code' : 'Generate setup code'}</button>
      {script && <div style={{ marginTop: 14 }}>
        <button type="button" className="btn" onClick={copyScript}>{copied ? 'Copied!' : 'Copy setup code'}</button>
        <textarea aria-label="Private Google Sheets setup code" readOnly value={script} onFocus={(e) => e.target.select()} rows={8} style={{ display: 'block', width: '100%', marginTop: 10, fontFamily: 'monospace', fontSize: 12 }} />
      </div>}
    </details>
  </section>
}
