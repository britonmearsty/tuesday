import type { MovieDetails, TVShowDetails, MediaDetails } from '../../types/media'
import type { DetailsTableRow, WatchProvider } from './types'

interface DetailsTableProps {
  details: MovieDetails | TVShowDetails
}

export function DetailsTable({ details }: DetailsTableProps): React.JSX.Element {
  const rows: DetailsTableRow[] = [
    { label: 'Status', value: details.status },
    { label: 'Original Language', value: details.originalLanguage?.toUpperCase() },
    {
      label: 'Budget',
      value: (details as MovieDetails).budget
        ? `$${(details as MovieDetails).budget?.toLocaleString()}`
        : null
    },
    {
      label: 'Revenue',
      value: (details as MovieDetails).revenue
        ? `$${(details as MovieDetails).revenue?.toLocaleString()}`
        : null
    },
    {
      label: 'Created By',
      value: (details as TVShowDetails).createdBy?.map((c) => c.name).join(', ')
    },
    { label: 'Networks', value: (details as TVShowDetails).networks?.join(', ') },
    {
      label: 'Production',
      value: (details as MovieDetails).productionCompanies?.join(', ')
    }
  ].filter((item) => item.value)

  return (
    <div>
      <h3 className="section-title">Details</h3>
      <div className="details-table">
        {rows.map((item, idx) => (
          <div key={idx} className="details-table-row">
            <span className="details-table-label">{item.label}</span>
            <span className="details-table-value">{item.value}</span>
          </div>
        ))}
      </div>

      <WatchProviders details={details} />
    </div>
  )
}

interface WatchProvidersProps {
  details: MediaDetails
}

export function WatchProviders({ details }: WatchProvidersProps): React.JSX.Element | null {
  const usProviders = (details as MediaDetails)['watch/providers']?.results?.US
  if (!usProviders) return null

  const providerTypes: Array<'flatrate' | 'rent' | 'buy'> = ['flatrate', 'rent', 'buy']

  return (
    <div className="watch-providers">
      <a
        href={usProviders.link || 'https://www.justwatch.com'}
        onClick={(e) => {
          e.preventDefault()
          window.api.openExternal(usProviders.link || 'https://www.justwatch.com')
        }}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <h4 className="watch-providers-title watch-providers-title--clickable">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8 }}>
            <path
              d="M15 10l5 5-5 5M4 14v-4a4 4 0 014-4h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Where to Watch (US)
        </h4>
      </a>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {providerTypes.map((type) => {
          const providers = usProviders[type]
          if (!providers || providers.length === 0) return null

          return (
            <div key={type}>
              <div className="watch-provider-type">{type === 'flatrate' ? 'Streaming' : type}</div>
              <div className="watch-providers-list">
                {providers.map((p: WatchProvider) => (
                  <a
                    key={p.provider_id}
                    href={usProviders.link || 'https://www.justwatch.com'}
                    onClick={(e) => {
                      e.preventDefault()
                      window.api.openExternal(usProviders.link || 'https://www.justwatch.com')
                    }}
                    className="watch-provider-item"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                      alt={p.provider_name}
                      title={`${p.provider_name} (Click to Watch)`}
                      className="watch-provider-logo"
                    />
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="watch-providers-footer">
        <span style={{ opacity: 0.7 }}>Data provided by</span>
        <a
          href={usProviders.link || 'https://www.justwatch.com'}
          onClick={(e) => {
            e.preventDefault()
            window.api.openExternal(usProviders.link || 'https://www.justwatch.com')
          }}
          className="watch-providers-link"
        >
          JustWatch
        </a>
      </div>
    </div>
  )
}
