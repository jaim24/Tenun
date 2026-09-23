export function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#161618" stroke="rgba(244,244,245,0.08)" />
      <g stroke="#F4F4F5" strokeWidth="1.2" opacity="0.5">
        <path d="M10 12V28" strokeDasharray="2 3" />
        <path d="M20 12V28" />
        <path d="M30 12V28" strokeDasharray="3 3" />
        <path d="M12 20H28" strokeDasharray="2 2" />
      </g>
      <line x1="8" y1="25" x2="32" y2="25" stroke="#E8633C" strokeWidth="2" />
      <circle cx="20" cy="25" r="3" fill="#E8633C" />
    </svg>
  );
}

export function MotifLines({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 280 420" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="0.75">
        <line x1="20" y1="0" x2="20" y2="420" strokeDasharray="2 4" />
        <line x1="80" y1="0" x2="80" y2="420" />
        <line x1="140" y1="0" x2="140" y2="420" strokeDasharray="4 6" />
        <line x1="200" y1="0" x2="200" y2="420" />
        <line x1="260" y1="0" x2="260" y2="420" strokeDasharray="1 3" />
        <line x1="0" y1="70" x2="280" y2="70" />
        <line x1="0" y1="140" x2="280" y2="140" strokeDasharray="3 3" />
        <line x1="0" y1="280" x2="280" y2="280" strokeDasharray="5 5" />
        <line x1="0" y1="350" x2="280" y2="350" />
      </g>
      <line x1="0" y1="210" x2="280" y2="210" stroke="#E8633C" strokeWidth="1.25" />
      <circle cx="140" cy="210" r="3.5" fill="#E8633C" />
      <circle cx="80" cy="70" r="2.5" fill="currentColor" />
      <circle cx="200" cy="350" r="2.5" fill="currentColor" />
    </svg>
  );
}