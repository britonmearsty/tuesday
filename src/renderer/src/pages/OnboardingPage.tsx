import { useState, useEffect } from 'react'
import { ChevronRight, Key, Film, Check, ArrowRight } from 'lucide-react'
import Titlebar from '../components/Titlebar'
import '../assets/tuesday.css'
import '../assets/onboarding.css'

interface OnboardingPageProps {
  onComplete: () => void
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps): React.JSX.Element {
  const [step, setStep] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Trakt states
  const [traktConnected, setTraktConnected] = useState(false)
  const [traktUsername, setTraktUsername] = useState('')
  const [traktLoading, setTraktLoading] = useState(false)
  const [traktAuthCode, setTraktAuthCode] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)
  const [traktError, setTraktError] = useState('')

  // IPTV states
  const [iptvUrl, setIptvUrl] = useState('https://iptv-org.github.io/iptv/index.m3u')
  const [iptvSaving, setIptvSaving] = useState(false)
  const [iptvError, setIptvError] = useState('')

  useEffect(() => {
    const checkTrakt = async (): Promise<void> => {
      try {
        const settings = await window.api.traktGetSettings()
        if (settings.isConnected) {
          setTraktConnected(true)
          const profile = await window.api.traktGetUserProfile()
          if (profile) {
            setTraktUsername(profile.username || profile.name)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    checkTrakt()
  }, [])

  const handleConnectTrakt = async (): Promise<void> => {
    setTraktLoading(true)
    setTraktError('')
    try {
      const authUrl = await window.api.traktGetAuthUrl()
      await window.api.openExternal(authUrl)
      setShowPinInput(true)
    } catch (err) {
      setTraktError(err instanceof Error ? err.message : 'Failed to start Trakt authentication.')
    } finally {
      setTraktLoading(false)
    }
  }

  const handleVerifyTrakt = async (): Promise<void> => {
    if (!traktAuthCode.trim()) {
      setTraktError('Please enter standard authorization code/PIN.')
      return
    }
    setTraktLoading(true)
    setTraktError('')
    try {
      const success = await window.api.traktExchangeCode(traktAuthCode.trim())
      if (success) {
        setTraktConnected(true)
        setShowPinInput(false)
        const profile = await window.api.traktGetUserProfile()
        if (profile) {
          setTraktUsername(profile.username || profile.name)
        }
      } else {
        setTraktError('Failed to connect to Trakt.')
      }
    } catch (err) {
      setTraktError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setTraktLoading(false)
    }
  }

  const steps = [
    { title: 'Welcome', description: "Let's get you set up in a few quick steps." },
    { title: 'API Key', description: 'Connect to TMDB to browse movies and TV shows.' },
    { title: 'Trakt.tv', description: 'Optional: Sync your watch history with Trakt.tv.' },
    { title: 'IPTV Playlist', description: 'Optional: Add your IPTV playlist for live TV.' },
    { title: 'Done', description: "You're all set. Let's start exploring!" }
  ]

  const handleNext = async (): Promise<void> => {
    if (step === 1) {
      const trimmedKey = apiKey.trim()
      if (!trimmedKey) {
        setError('Please enter your TMDB API key to continue.')
        return
      }
      setSaving(true)
      setError('')
      try {
        await window.api.tmdbSetApiKey(trimmedKey)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save API key.')
        setSaving(false)
        return
      }
      setSaving(false)
    }

    if (step === 2) {
      // Trakt setup step - for now just continue (would implement actual auth in a real app)
      // In a real implementation, this would initiate the Trakt device auth flow
    }

    if (step === 3) {
      // IPTV setup step
      const url = iptvUrl.trim()

      if (url) {
        setIptvSaving(true)
        setIptvError('')
        try {
          await window.api.tmdbSetIptvPlaylistUrl(url)
        } catch (err) {
          setIptvError(err instanceof Error ? err.message : 'Failed to save playlist.')
          setIptvSaving(false)
          return
        }
        setIptvSaving(false)
      }
    }

    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = (): void => {
    if (step > 0) setStep(step - 1)
  }

  const handleGetStarted = async (): Promise<void> => {
    try {
      await window.api.onboardingComplete()
    } catch {
      // proceed regardless
    }
    window.dispatchEvent(new Event('tmdb-key-changed'))
    onComplete()
  }

  return (
    <div className="onboarding-overlay">
      <Titlebar title="Tuesday" />
      <div className="onboarding-content">
        {/* Card */}
        <div className="onboarding-card">
          <div className="onboarding-step-label">
            Step {step + 1} of {steps.length}
          </div>

          {step === 0 && (
            <div className="onboarding-welcome">
              <div className="onboarding-logo">
                <Film size={36} strokeWidth={1.5} />
                <span className="onboarding-logo-text">Tuesday</span>
              </div>
              <p className="onboarding-welcome-desc">
                Your cinematic companion for browsing and watching movies, TV series, anime and live
                TV — all in one place.
              </p>
              <div className="onboarding-features">
                <div className="onboarding-feature">
                  <ChevronRight size={14} />
                  <span>Browse thousands of movies and shows</span>
                </div>
                <div className="onboarding-feature">
                  <ChevronRight size={14} />
                  <span>Powered by TMDB metadata</span>
                </div>
                <div className="onboarding-feature">
                  <ChevronRight size={14} />
                  <span>Trakt.tv sync for watch history</span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-apikey">
              <div className="onboarding-icon-wrap">
                <Key size={28} strokeWidth={1.5} />
              </div>
              <h2 className="onboarding-heading">Connect TMDB</h2>
              <p className="onboarding-desc">
                Tuesday uses TMDB (The Movie Database) to fetch movie and show information. Enter
                your free API key below to get started.
              </p>
              <a
                href="https://www.themoviedb.org/settings/api"
                onClick={(e): void => {
                  e.preventDefault()
                  window.api.openExternal('https://www.themoviedb.org/settings/api')
                }}
                className="onboarding-link"
              >
                Get your free API key at themoviedb.org →
              </a>
              <input
                type="password"
                placeholder="Paste your TMDB API key"
                value={apiKey}
                onChange={(e): void => {
                  setApiKey(e.target.value)
                  if (error) setError('')
                }}
                className="onboarding-input"
                disabled={saving}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter') handleNext()
                }}
              />
              {error && <p className="onboarding-error">{error}</p>}
              {saving && <p className="onboarding-saving">Saving…</p>}
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-trakt">
              <div className="onboarding-icon-wrap">
                <Key size={28} strokeWidth={1.5} />
              </div>
              <h2 className="onboarding-heading">Connect Trakt.tv (Optional)</h2>
              <p className="onboarding-desc">
                Sync watch history, scrobble your playback progress, and get personal
                recommendations.
              </p>

              {traktConnected ? (
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.15))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '18px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginTop: '15px',
                    width: '100%',
                    maxWidth: '360px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      color: '#10b981',
                      fontWeight: 600,
                      fontSize: '15px',
                      marginBottom: '6px'
                    }}
                  >
                    ✓ Connected
                  </div>
                  <p style={{ fontSize: '13px', color: '#b0b0c0', margin: '0 0 14px' }}>
                    Successfully connected as <strong>@{traktUsername}</strong>
                  </p>
                  <button
                    className="onboarding-btn-secondary"
                    onClick={async () => {
                      await window.api.traktDisconnect()
                      setTraktConnected(false)
                      setTraktUsername('')
                    }}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : showPinInput ? (
                <div style={{ width: '100%', maxWidth: '360px', marginTop: '10px' }}>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#b0b0c0',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}
                  >
                    We opened standard Trakt authorization page in your browser. Log in, click{' '}
                    <strong>Authorize</strong>, then return here and enter standard PIN code
                    displayed.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter standard authorization code"
                    value={traktAuthCode}
                    onChange={(e) => setTraktAuthCode(e.target.value)}
                    className="onboarding-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyTrakt()
                    }}
                    style={{ textAlign: 'center', fontWeight: 'bold' }}
                  />
                  {traktError && (
                    <p className="onboarding-error" style={{ marginTop: '8px' }}>
                      {traktError}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button
                      className="onboarding-btn-primary"
                      onClick={handleVerifyTrakt}
                      disabled={traktLoading}
                    >
                      {traktLoading ? 'Connecting...' : 'Connect'}
                    </button>
                    <button
                      className="onboarding-btn-secondary"
                      onClick={() => setShowPinInput(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <button
                    className="onboarding-btn-primary"
                    onClick={handleConnectTrakt}
                    disabled={traktLoading}
                  >
                    {traktLoading ? 'Opening browser...' : 'Connect Trakt Account'}
                  </button>
                  {traktError && <p className="onboarding-error">{traktError}</p>}
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.3)',
                      margin: '4px 0 0'
                    }}
                  >
                    Or just click <strong>Continue</strong> below to skip this step.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-iptv">
              <div className="onboarding-icon-wrap">
                <Film size={28} strokeWidth={1.5} />
              </div>
              <h2 className="onboarding-heading">Add IPTV Playlist (Optional)</h2>
              <p className="onboarding-desc">
                Add your IPTV playlist to watch live TV channels. You can add multiple playlists
                later from Settings. This step is optional.
              </p>
              <div className="iptv-fields">
                <div className="iptv-field-group">
                  <label className="onboarding-label">M3U Playlist URL</label>
                  <input
                    type="text"
                    placeholder="http://example.com/playlist.m3u"
                    value={iptvUrl}
                    onChange={(e): void => {
                      setIptvUrl(e.target.value)
                      if (iptvError) setIptvError('')
                    }}
                    className="onboarding-input"
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter') handleNext()
                    }}
                  />
                </div>
              </div>
              {iptvError && <p className="onboarding-error">{iptvError}</p>}
              {iptvSaving && <p className="onboarding-saving">Saving…</p>}
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-done">
              <div className="onboarding-done-check">
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h2 className="onboarding-heading">You&apos;re all set!</h2>
              <p className="onboarding-desc">
                Your API key has been saved successfully. You&apos;re ready to start exploring your
                media library.
              </p>
              <div className="onboarding-done-stats">
                <div className="onboarding-stat">
                  <span className="onboarding-stat-value">Ready</span>
                  <span className="onboarding-stat-label">Movies &amp; Shows</span>
                </div>
                <div className="onboarding-stat">
                  <span className="onboarding-stat-value">Optional</span>
                  <span className="onboarding-stat-label">Trakt Sync</span>
                </div>
                <div className="onboarding-stat">
                  <span className="onboarding-stat-value">Optional</span>
                  <span className="onboarding-stat-label">IPTV Playlist</span>
                </div>
              </div>
              <p className="onboarding-settings-note">
                You can always connect Trakt.tv or add IPTV playlists later in Settings.
              </p>
            </div>
          )}
          <div className="onboarding-actions">
            {step > 0 && (
              <button className="onboarding-btn-secondary" onClick={handleBack}>
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                className="onboarding-btn-primary"
                onClick={handleNext}
                disabled={saving || iptvSaving}
              >
                {saving || iptvSaving ? 'Saving…' : step === 0 ? 'Get Started' : 'Continue'}
                {!saving && !iptvSaving && <ArrowRight size={16} />}
              </button>
            ) : (
              <button className="onboarding-btn-primary" onClick={handleGetStarted}>
                Start Exploring
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
