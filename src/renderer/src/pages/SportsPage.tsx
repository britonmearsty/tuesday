function SportsPage(): React.JSX.Element {
  return (
    <div className="page-container">
      <div className="catalog-section">
        <div className="catalog-header">
          <h2>Sports</h2>
        </div>
        <div className="coming-soon">
          <div className="coming-soon-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v4M12 20v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M20 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h3>Sports Coming Soon</h3>
          <p>
            We&apos;re working on adding live sports support. Soon you&apos;ll be able to watch live
            sports events and highlights.
          </p>
          <p className="note">This feature will integrate with live sports streaming services.</p>
        </div>
      </div>
    </div>
  )
}

export default SportsPage
