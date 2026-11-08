import data from './iconData.js';

export default function Icon({ name, size = 24, color, style, label }) {
  const d = data[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={d.vb}
      style={{ color, flexShrink: 0, display: 'block', ...style }}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: d.body }}
    />
  );
}

// The "←-" back arrow used across the design
export function BackArrow({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 28 21" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3.5L2.5 10.5L9 17.5" />
      <path d="M2.5 10.5H17" />
      <path d="M21.5 10.5H25.5" />
    </svg>
  );
}

// The "-→" pointer arrows on the anxiety scale
export function PointArrow({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 28 21" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 3.5L25.5 10.5L19 17.5" />
      <path d="M25.5 10.5H11" />
      <path d="M2.5 10.5H6.5" />
    </svg>
  );
}
