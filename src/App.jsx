import { useEffect, useMemo, useState } from 'react'
import { castaways, defaultRanking } from './data/cast.js'
import { getToken, initAuth, logout, openLogin } from './auth.js'

const castById = Object.fromEntries(castaways.map((castaway) => [castaway.id, castaway]))

function App() {
  const [user, setUser] = useState(null)
  const [ranking, setRanking] = useState(defaultRanking)
  const [selectedId, setSelectedId] = useState(defaultRanking[0])
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => initAuth(setUser), [])

  useEffect(() => {
    async function loadRanking() {
      if (!user) return
      const token = getToken(user)
      if (!token) return

      try {
        setStatus('Loading your ranking...')
        const response = await fetch('/.netlify/functions/my-ranking', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Could not load ranking')
        const data = await response.json()
        if (Array.isArray(data.ranking) && data.ranking.length) {
          setRanking(normalizeRanking(data.ranking))
        }
        setStatus(data.updatedAt ? `Last saved ${new Date(data.updatedAt).toLocaleString()}` : 'No saved ranking yet')
      } catch (error) {
        setStatus('Could not load your saved ranking yet.')
      }
    }

    loadRanking()
  }, [user])

  const orderedCast = useMemo(() => ranking.map((id) => castById[id]).filter(Boolean), [ranking])
  const selected = castById[selectedId] || orderedCast[0]

  function move(id, direction) {
    setRanking((current) => {
      const next = [...current]
      const index = next.indexOf(id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function resetToRoy() {
    setRanking(defaultRanking)
    setSelectedId(defaultRanking[0])
    setStatus('Reset locally. Save to keep this ranking.')
  }

  async function saveRanking() {
    if (!user) {
      openLogin()
      return
    }

    const token = getToken(user)
    if (!token) {
      setStatus('Sign in again before saving.')
      return
    }

    setSaving(true)
    setStatus('Saving...')
    try {
      const response = await fetch('/.netlify/functions/my-ranking', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ranking })
      })
      if (!response.ok) throw new Error('Save failed')
      const data = await response.json()
      setStatus(`Saved ${new Date(data.updatedAt).toLocaleString()}`)
    } catch (error) {
      setStatus('Could not save. Check Netlify Identity and Blobs setup.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Private fan rankings</p>
          <h1>Survivor 51 Rankings</h1>
          <p className="subhead">Rank the rumored cast from most likely to win to least likely. Your ranking is private to your login.</p>
        </div>
        <div className="authCard">
          {user ? (
            <>
              <p className="signedIn">Signed in as</p>
              <strong>{user.user_metadata?.full_name || user.email}</strong>
              <button className="ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <p>Sign in to save your ranking.</p>
              <button onClick={openLogin}>Sign in with Google</button>
            </>
          )}
        </div>
      </header>

      <section className="toolbar">
        <button onClick={saveRanking} disabled={saving}>{saving ? 'Saving...' : 'Save my ranking'}</button>
        <button className="ghost" onClick={resetToRoy}>Reset to Roy's board</button>
        <span>{status}</span>
      </section>

      <section className="layout">
        <div className="panel rankingPanel">
          <h2>My winner board</h2>
          <div className="rankingList">
            {orderedCast.map((castaway, index) => (
              <article key={castaway.id} className={`rankRow ${selected?.id === castaway.id ? 'active' : ''}`} onClick={() => setSelectedId(castaway.id)}>
                <div className="rankNum">{index + 1}</div>
                <div className="rankMain">
                  <strong>{castaway.name}</strong>
                  <span>{castaway.tribe} · Roy rank #{castaway.royRank}</span>
                </div>
                <div className="rankActions">
                  <button aria-label={`Move ${castaway.name} up`} onClick={(event) => { event.stopPropagation(); move(castaway.id, -1) }}>↑</button>
                  <button aria-label={`Move ${castaway.name} down`} onClick={(event) => { event.stopPropagation(); move(castaway.id, 1) }}>↓</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel detailPanel">
          {selected && (
            <>
              <p className="eyebrow">{selected.tribe} tribe</p>
              <h2>{selected.name}</h2>
              <p className="meta">Age {selected.age} · {selected.background}</p>
              <h3>Pros</h3>
              <ul>{selected.pros.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>Cons</h3>
              <ul>{selected.cons.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          )}
        </aside>
      </section>
    </main>
  )
}

function normalizeRanking(savedRanking) {
  const valid = savedRanking.filter((id) => castById[id])
  const missing = defaultRanking.filter((id) => !valid.includes(id))
  return [...valid, ...missing]
}

export default App
