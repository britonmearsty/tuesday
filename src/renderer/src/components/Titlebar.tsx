import type { FC } from 'react'

interface TitlebarProps {
  title: string
}

const Titlebar: FC<TitlebarProps> = ({ title }) => {
  const handleMinimize = (): void => {
    window.api.minimizeWindow()
  }

  const handleMaximize = (): void => {
    window.api.maximizeWindow()
  }

  const handleClose = (): void => {
    window.api.closeWindow()
  }

  return (
    <header className="titlebar">
      <div className="titlebar-drag-region">
        <span className="titlebar-title">{title}</span>
      </div>
      <div className="titlebar-controls">
        <button className="control-btn minimize" onClick={handleMinimize} aria-label="Minimize">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="1.5" y="4.5" width="7" height="1" fill="currentColor" rx="0.5" />
          </svg>
        </button>
        <button className="control-btn maximize" onClick={handleMaximize} aria-label="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              x="1.5"
              y="1.5"
              width="7"
              height="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              rx="1"
            />
          </svg>
        </button>
        <button className="control-btn close" onClick={handleClose} aria-label="Close">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M1 1 L9 9 M9 1 L1 9"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Titlebar
