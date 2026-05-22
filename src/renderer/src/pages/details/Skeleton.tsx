const shimmerStyle = {
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.5s ease-in-out infinite'
}

const cssAnimations = `
  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

export function EpisodesSkeleton(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        className="hide-scrollbar horizontal-scroll horizontal-scroll--episodes"
        style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: '300px',
              maxWidth: '300px',
              height: '180px',
              borderRadius: '16px',
              flexShrink: 0,
              overflow: 'hidden',
              ...shimmerStyle
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function ShimmerSkeleton(): React.JSX.Element {
  return (
    <>
      <style>{cssAnimations}</style>
      <div style={{ color: '#ffffff' }}>
        <div style={{ height: '400px', background: '#1a1a1a', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(to top, rgba(20,20,21,1) 0%, transparent 100%)'
            }}
          />
        </div>

        <div
          style={{ padding: '0 24px 24px', marginTop: '-120px', position: 'relative', zIndex: 5 }}
        >
          <div
            style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '40px' }}
          >
            <div style={{ flex: '0 0 180px' }}>
              <div style={{ ...shimmerStyle, height: '270px', borderRadius: '16px' }} />
            </div>

            <div style={{ flex: 1, paddingBottom: '12px' }}>
              <div
                style={{
                  ...shimmerStyle,
                  height: '48px',
                  width: '60%',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              />
              <div
                style={{
                  ...shimmerStyle,
                  height: '20px',
                  width: '40%',
                  borderRadius: '4px',
                  marginBottom: '24px'
                }}
              />

              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{ ...shimmerStyle, height: '24px', width: '70px', borderRadius: '12px' }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{ ...shimmerStyle, height: '46px', width: '140px', borderRadius: '30px' }}
                />
                <div
                  style={{ ...shimmerStyle, height: '46px', width: '100px', borderRadius: '30px' }}
                />
                <div
                  style={{ ...shimmerStyle, height: '46px', width: '100px', borderRadius: '30px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ ...shimmerStyle, height: '28px', width: '80px', borderRadius: '14px' }}
              />
            ))}
          </div>

          <div className="section">
            <div
              style={{
                ...shimmerStyle,
                height: '28px',
                width: '100px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}
            />
            <div
              style={{
                ...shimmerStyle,
                height: '16px',
                width: '100%',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            />
            <div
              style={{
                ...shimmerStyle,
                height: '16px',
                width: '90%',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            />
            <div style={{ ...shimmerStyle, height: '16px', width: '75%', borderRadius: '4px' }} />
          </div>

          <div className="section">
            <div
              style={{
                ...shimmerStyle,
                height: '28px',
                width: '120px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
            />
            <div
              className="horizontal-scroll hide-scrollbar"
              style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ flex: '0 0 200px' }}>
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '120px',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '12px',
                        width: '80%',
                        borderRadius: '4px',
                        margin: '0 auto 6px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '10px',
                        width: '50%',
                        borderRadius: '4px',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div
              style={{
                ...shimmerStyle,
                height: '28px',
                width: '80px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
            />
            <div
              className="horizontal-scroll hide-scrollbar"
              style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
            >
              <div style={{ display: 'flex', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        ...shimmerStyle,
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        marginBottom: '10px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '12px',
                        width: '70px',
                        borderRadius: '4px',
                        margin: '0 auto 6px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '10px',
                        width: '50px',
                        borderRadius: '4px',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div
              style={{
                ...shimmerStyle,
                height: '28px',
                width: '150px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
            />
            <div
              className="horizontal-scroll hide-scrollbar"
              style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <div
                      style={{
                        ...shimmerStyle,
                        width: '170px',
                        height: '195px',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '12px',
                        width: '90%',
                        borderRadius: '4px',
                        margin: '0 auto 6px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '10px',
                        width: '60%',
                        borderRadius: '4px',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div
              style={{
                ...shimmerStyle,
                height: '28px',
                width: '180px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
            />
            <div
              className="horizontal-scroll hide-scrollbar"
              style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <div
                      style={{
                        ...shimmerStyle,
                        width: '170px',
                        height: '195px',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '12px',
                        width: '90%',
                        borderRadius: '4px',
                        margin: '0 auto 6px'
                      }}
                    />
                    <div
                      style={{
                        ...shimmerStyle,
                        height: '10px',
                        width: '60%',
                        borderRadius: '4px',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div className="section">
              <div
                style={{
                  ...shimmerStyle,
                  height: '28px',
                  width: '120px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}
              />
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    ...shimmerStyle,
                    height: '20px',
                    width: `${60 + i * 8}%`,
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}
                />
              ))}
            </div>

            <div className="section">
              <div
                style={{
                  ...shimmerStyle,
                  height: '28px',
                  width: '100px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}
              />
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      ...shimmerStyle,
                      height: '16px',
                      width: '80%',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  />
                  <div
                    style={{ ...shimmerStyle, height: '12px', width: '90%', borderRadius: '4px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
