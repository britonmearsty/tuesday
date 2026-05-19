import { useState, useEffect } from 'react'

function SettingsPage(): React.JSX.Element {
  const [apiKey, setApiKey] = useState('')
  const [language, setLanguage] = useState('en-US')
  const [region, setRegion] = useState('US')
  const [hasKey, setHasKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [iptvPlaylistUrl, setIptvPlaylistUrl] = useState('')

  const [traktConnected, setTraktConnected] = useState(false)
  const [traktLoading, setTraktLoading] = useState(false)
  const [traktAuthCode, setTraktAuthCode] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)
  const [traktUser, setTraktUser] = useState<{
    username: string
    name: string
    avatar: string
  } | null>(null)

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await window.api.tmdbGetConfig()
        setApiKey(config.apiKey)
        setLanguage(config.language)
        setRegion(config.region)
        setHasKey(!!config.apiKey)
        setIptvPlaylistUrl(config.iptvPlaylistUrl || '')

        // Load Trakt settings
        const traktConfig = await window.api.traktGetSettings()
        setTraktConnected(traktConfig.isConnected)
        if (traktConfig.isConnected) {
          const profile = await window.api.traktGetUserProfile()
          if (profile) {
            setTraktUser(profile)
          } else {
            setTraktConnected(false)
          }
        }
      } catch (err) {
        console.error('Failed to load config:', err)
      }
    }

    loadConfig()
  }, [])

  const handleConnectTrakt = async (): Promise<void> => {
    setTraktLoading(true)
    try {
      const authUrl = await window.api.traktGetAuthUrl()
      await window.api.openExternal(authUrl)
      setShowPinInput(true)
    } catch (err) {
      console.error('Failed to get Trakt auth URL:', err)
      alert('Error: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setTraktLoading(false)
    }
  }

  const handleSubmitPin = async (): Promise<void> => {
    if (!traktAuthCode.trim()) {
      alert('Please enter standard authorization code/PIN displayed in your browser.')
      return
    }
    setTraktLoading(true)
    try {
      const success = await window.api.traktExchangeCode(traktAuthCode.trim())
      if (success) {
        setTraktConnected(true)
        setShowPinInput(false)
        setTraktAuthCode('')
        try {
          const profile = await window.api.traktGetUserProfile()
          if (profile) {
            setTraktUser(profile)
            alert('Connected successfully to Trakt.tv!')
          } else {
            setTraktConnected(false)
            alert('Connected, but failed to fetch user profile. Please try again.')
          }
        } catch (profileErr) {
          console.error('Failed to fetch user profile after connection:', profileErr)
          setTraktConnected(false)
          alert('Failed to fetch user profile. Please try again.')
        }
      } else {
        alert('Connection failed.')
      }
    } catch (err) {
      console.error('Trakt PIN exchange failed:', err)
      alert('Error connecting: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setTraktLoading(false)
    }
  }

  const handleDisconnectTrakt = async (): Promise<void> => {
    if (confirm('Are you sure you want to disconnect your Trakt.tv account?')) {
      try {
        await window.api.traktDisconnect()
        setTraktConnected(false)
        setShowPinInput(false)
        setTraktAuthCode('')
        setTraktUser(null)
        alert('Disconnected successfully from Trakt.tv.')
      } catch (err) {
        console.error('Failed to disconnect Trakt:', err)
      }
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      if (apiKey.trim()) {
        await window.api.tmdbSetApiKey(apiKey.trim())
        setHasKey(true)
      } else {
        setHasKey(false)
      }
      await window.api.tmdbSetLanguage(language)
      await window.api.tmdbSetRegion(region)
      if (iptvPlaylistUrl.trim()) {
        await window.api.tmdbSetIptvPlaylistUrl(iptvPlaylistUrl.trim())
      }
      window.dispatchEvent(new Event('tmdb-key-changed'))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save config:', err)
    }
  }

  return (
    <div className="page-container">
      <div className="settings-section">
        <h2>Settings</h2>

        <div className="setting-item">
          <label>TMDB API Key</label>
          <input
            type="password"
            placeholder="Enter your TMDB API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="settings-input"
            style={{ width: '100%', maxWidth: '400px' }}
          />
          <p style={{ fontSize: '12px', color: '#8a8a9a', margin: 0 }}>
            Get your free API key from{' '}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#6366f1' }}
            >
              themoviedb.org
            </a>
          </p>
        </div>

        <div className="setting-item">
          <label>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="settings-input"
            style={{ width: '200px' }}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="it-IT">Italian</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="ru-RU">Russian</option>
            <option value="zh-CN">Chinese (Simplified)</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="settings-input"
            style={{ width: '200px' }}
          >
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
            <option value="BR">Brazil</option>
            <option value="MX">Mexico</option>
            <option value="IN">India</option>
          </select>
        </div>
        <div className="setting-item">
          <label>IPTV Playlist URL</label>
          <p style={{ fontSize: '12px', color: '#8a8a9a', margin: '0 0 8px 0' }}>
            Paste your M3U playlist URL for live TV channels (from apps like IPTV Smarters, Perfect
            Player, etc.)
          </p>
          <input
            type="url"
            placeholder="https://example.com/playlist.m3u8"
            value={iptvPlaylistUrl}
            onChange={(e) => setIptvPlaylistUrl(e.target.value)}
            className="settings-input"
            style={{ width: '100%', maxWidth: '500px' }}
          />
        </div>

        <div
          className="setting-item"
          style={{
            borderTop: '1px solid #32363f',
            paddingTop: '24px',
            marginTop: '24px'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#e6e6f0' }}>Trakt.tv Integration</h3>
          <p style={{ fontSize: '12px', color: '#8a8a9a', margin: '0 0 16px 0' }}>
            Sync your playback progress (scrobble), watch lists, and viewing history.
          </p>

          {traktConnected ? (
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.18))',
                border: '1px solid #10b981',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {traktUser?.avatar ? (
                  <img
                    src={traktUser.avatar}
                    referrerPolicy="no-referrer"
                    alt="Trakt Avatar"
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid #10b981',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      border: '2.5px solid #10b981',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {traktUser?.username ? traktUser.username[0].toUpperCase() : 'T'}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: '#e6e6f0', fontSize: '14px' }}>
                      {traktUser?.name || traktUser?.username || 'Trakt User'}
                    </strong>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      ✓ Connected
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#8a8a9a', margin: '2px 0 0 0' }}>
                    {traktUser?.username ? `@${traktUser.username}` : 'Scrobbling active'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDisconnectTrakt}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.05)'
                }}
                onMouseOver={(e): void => {
                  e.currentTarget.style.background = '#ef4444'
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.borderColor = '#ef4444'
                }}
                onMouseOut={(e): void => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                  e.currentTarget.style.color = '#f87171'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
                }}
              >
                Disconnect
              </button>
            </div>
          ) : showPinInput ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: '#1b1b1c',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #2d2d30',
                maxWidth: '500px'
              }}
            >
              <p style={{ fontSize: '13px', color: '#b0b0c0', margin: '0', lineHeight: '1.6' }}>
                We opened standard Trakt authorization page in your browser. Log in, click{' '}
                <strong>Authorize</strong>, then return here and enter standard PIN/authorization
                code Trakt displays below.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#8a8a9a', fontWeight: '600' }}>
                  Authorization Code / PIN
                </label>
                <input
                  type="text"
                  placeholder="Paste PIN code here"
                  value={traktAuthCode}
                  onChange={(e): void => setTraktAuthCode(e.target.value)}
                  className="settings-input"
                  style={{
                    width: '100%',
                    background: '#141415',
                    border: '1px solid #2d2d30',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSubmitPin}
                  disabled={traktLoading}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                    fontSize: '13px'
                  }}
                >
                  {traktLoading ? 'Connecting...' : 'Connect Account'}
                </button>
                <button
                  onClick={(): void => {
                    setShowPinInput(false)
                    setTraktAuthCode('')
                  }}
                  style={{
                    background: '#222222',
                    color: '#e6e6f0',
                    border: '1px solid #32363f',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectTrakt}
              disabled={traktLoading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: 'fit-content',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                fontSize: '13px',
                transition: 'transform 0.15s, opacity 0.2s'
              }}
              onMouseOver={(e): void => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e): void => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {traktLoading ? 'Opening browser...' : 'Connect Trakt.tv'}
            </button>
          )}
        </div>

        <div
          className="setting-item"
          style={{
            borderTop: '1px solid #32363f',
            paddingTop: '24px',
            marginTop: '24px'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#e6e6f0' }}>Onboarding</h3>
          <p style={{ fontSize: '12px', color: '#8a8a9a', margin: '0 0 16px 0' }}>
            Re-run the first-time setup wizard to re-configure your API keys and preferences.
          </p>
          <button
            onClick={async (): Promise<void> => {
              await window.api.onboardingComplete()
              window.location.reload()
            }}
            style={{
              background: '#222222',
              color: '#e6e6f0',
              border: '1px solid #32363f',
              padding: '10px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'background 0.2s, border-color 0.2s'
            }}
            onMouseOver={(e): void => {
              e.currentTarget.style.background = '#32363f'
              e.currentTarget.style.borderColor = '#d94a4a'
            }}
            onMouseOut={(e): void => {
              e.currentTarget.style.background = '#222222'
              e.currentTarget.style.borderColor = '#32363f'
            }}
          >
            Revisit Onboarding
          </button>
        </div>

        <button className="save-button" onClick={handleSave}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {!hasKey && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: '#222222',
              borderRadius: '8px',
              border: '1px solid #32363f'
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#e6e6f0' }}>Getting Started</h4>
            <p style={{ fontSize: '14px', color: '#b0b0c0', margin: 0, lineHeight: '1.5' }}>
              To use Tuesday, you need a free TMDB API key.{' '}
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6366f1' }}
              >
                Create an account and get your API key
              </a>
              {'. Then paste it above and click Save.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
