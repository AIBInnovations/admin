import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { downloadCreatorWorkbook } from '../services/creatorWorkbook.js'

export default function Lookups() {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [refresh, setRefresh] = useState(0)
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

  async function exportAll() {
    setExporting(true)
    setError('')
    try {
      const res = await api.exportLookups()
      downloadCreatorWorkbook((res.data || []).map((row) => ({ ...row.profile, ...row, username: row.username })))
    } catch (e) { setError(e.message || 'Export failed') }
    finally { setExporting(false) }
  }

  return <div>
    <div className="page-head"><div><h1>Lookup leads</h1><p>Public creator details collected when usernames are looked up. Available to your team only.</p></div>
      <button className="btn btn-primary" onClick={exportAll} disabled={exporting}>{exporting ? 'Exporting...' : 'Download all (Excel)'}</button>
    </div>
    {error && <p role="alert" className="badge badge-red">{error}</p>}
    <div className="row items-center gap-12" style={{ marginBottom: 16 }}>
      <input className="input" aria-label="Search lookup usernames" placeholder="Search username" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      <button className="btn" onClick={() => setRefresh((n) => n + 1)}>Refresh</button>
      <span>{count} creators</span>
    </div>
    <div className="card table-wrap"><table className="table"><thead><tr>
      <th>Creator</th><th>Followers</th><th>Lookups</th><th>Last lookup</th><th>Status</th><th>Creator URL</th>
    </tr></thead><tbody>
      {loading ? <tr><td colSpan={6}>Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan={6}>No lookup leads found.</td></tr> : rows.map((row) => <tr key={row._id}>
        <td><strong>@{row.username}</strong><br />{row.profile?.fullName || ''}</td>
        <td>{row.profile?.followers == null ? '-' : Number(row.profile.followers).toLocaleString()}</td>
        <td>{row.lookupCount}</td><td>{row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString() : '-'}</td>
        <td>{row.lastStatus}{row.stale ? ' (stale cache)' : ''}</td>
        <td><a href={row.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram profile</a></td>
      </tr>)}
    </tbody></table></div>
    <div className="row items-center gap-12" style={{ marginTop: 16 }}>
      <button className="btn" disabled={loading || page === 1} onClick={() => setPage((n) => n - 1)}>Previous</button>
      <span>Page {page} of {Math.max(1, Math.ceil(count / 25))}</span>
      <button className="btn" disabled={loading || page * 25 >= count} onClick={() => setPage((n) => n + 1)}>Next</button>
    </div>
  </div>
}
