interface HeroSectionProps {
  background?: string | null
}

export function HeroSection({ background }: HeroSectionProps): React.JSX.Element {
  const bgStyle = background
    ? `linear-gradient(to bottom, rgba(20,20,21,0) 0%, rgba(20,20,21,0.15) 25%, rgba(20,20,21,0.45) 50%, rgba(20,20,21,0.8) 75%, rgba(20,20,21,1) 100%), url(${background})`
    : '#1a1a1a'

  return <div className="details-hero" style={{ background: bgStyle }} />
}
