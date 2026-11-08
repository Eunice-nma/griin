// The Griin logo: the dots of the i's stretch into eyes and a smile appears.
// mode "play" runs the animation once; mode "still" is the finished wordmark.
export default function Logo({ size = 128, color = '#1f4a22', eye = color, mode = 'still', label = 'Griin' }) {
  return (
    <div className={`lg ${mode === 'play' ? 'lg-play' : 'lg-still'}`} role="img" aria-label={label}
      style={{ '--s': `${size}px`, '--lg-c': color, '--lg-e': eye }}>
      <span className="lg-L" aria-hidden="true">Gr</span>
      <span className="lg-ii" aria-hidden="true">
        <span className="lg-i lg-i1"><span className="lg-stem" /><span className="lg-dot" /></span>
        <span className="lg-i lg-i2"><span className="lg-stem" /><span className="lg-dot" /></span>
        <svg className="lg-smile" viewBox="0 0 90 50"><path d="M8 8 Q45 48 82 8" /></svg>
      </span>
      <span className="lg-R" aria-hidden="true">n</span>
    </div>
  );
}
