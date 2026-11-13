import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import LookupGoogleSheet from '../components/LookupGoogleSheet.jsx'

const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_URL || 'https://creasume.com').replace(/\/+$/, '')
const LOOKUP_URL = `${PUBLIC_SITE}/instagram-lookup`
const creatorLookupUrl = (username) => `${PUBLIC_SITE}/preview?lookup=${encodeURIComponent(username)}`

function CopyIcon({ copied }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {copied ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>}
  </svg>
}

export default function Lookups() {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [copied, setCopied] = useState('')

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setError('')
    } catch {
      setCopied('')
      setError('Could not copy automatically. Select and copy the displayed URL.')
    }
  }
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.lookups({ page, limit: 25, search }).then((res) => {
      if (active) { setRows(res.data || []); setCount(res.count || 0) }
    }).catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search, refresh])

  return <div>
    <div className="page-head"><div><h1>Lookup leads</h1><p>Public creator details collected when usernames are looked up. Available to your team only.</p></div>
    </div>
    <LookupGoogleSheet />
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <label htmlFor="main-lookup-url" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Main lookup URL</label>
      <div className="row items-center gap-12" style={{ flexWrap: 'wrap' }}>
        <input id="main-lookup-url" className="input" readOnly value={LOOKUP_URL} onFocus={(event) => event.target.select()} style={{ flex: 1, minWidth: 220 }} />
        <button type="button" className="btn" aria-label="Copy main lookup URL" title={copied === LOOKUP_URL ? 'Copied!' : 'Copy link'} onClick={() => copyLink(LOOKUP_URL)}><CopyIcon copied={copied === LOOKUP_URL} /></button>
        <a href={LOOKUP_URL} target="_blank" rel="noopener noreferrer">Open lookup</a>
      </div>
    </div>
    <span role="status" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{copied ? 'Link copied to clipboard.' : ''}</span>
    {error && <p role="alert" className="badge badge-red">{error}</p>}
    <div className="row items-center gap-12" style={{ marginBottom: 16 }}>
      <input className="input" aria-label="Search lookup usernames" placeholder="Search username" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      <button className="btn" onClick={() => setRefresh((n) => n + 1)}>Refresh</button>
      <span>{count} creators</span>
    </div>
    <div className="card table-wrap"><table className="table"><thead><tr>
      <th>Creator</th><th>Followers</th><th>Last lookup</th><th>Lookup URL</th>
    </tr></thead><tbody>
      {loading ? <tr><td colSpan={4}>Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan={4}>No lookup leads found.</td></tr> : rows.map((row) => <tr key={row._id}>
        <td><strong>@{row.username}</strong><br />{row.profile?.fullName || ''}</td>
        <td>{row.profile?.followers == null ? '-' : Number(row.profile.followers).toLocaleString()}</td>
        <td>{row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString() : '-'}</td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
            <a href={creatorLookupUrl(row.username)} target="_blank" rel="noopener noreferrer" style={{ whiteSpace: 'nowrap' }}>{creatorLookupUrl(row.username)}</a>
            <button type="button" className="btn" style={{ flexShrink: 0, padding: 8 }} aria-label={`Copy lookup link for ${row.username}`} title={copied === creatorLookupUrl(row.username) ? 'Copied!' : 'Copy link'} onClick={() => copyLink(creatorLookupUrl(row.username))}><CopyIcon copied={copied === creatorLookupUrl(row.username)} /></button>
          </div>
        </td>
      </tr>)}
    </tbody></table></div>
    <div className="row items-center gap-12" style={{ marginTop: 16 }}>
      <button className="btn" disabled={loading || page === 1} onClick={() => setPage((n) => n - 1)}>Previous</button>
      <span>Page {page} of {Math.max(1, Math.ceil(count / 25))}</span>
      <button className="btn" disabled={loading || page * 25 >= count} onClick={() => setPage((n) => n + 1)}>Next</button>
    </div>
  </div>
}
