// Decorative inline illustrations; hidden from assistive technology.

export function PaperQuizIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden fill="none">
      <rect x="38" y="14" width="120" height="136" rx="12" fill="#fff" stroke="#e4ddd2" strokeWidth="2" />
      <rect x="54" y="32" width="70" height="8" rx="4" fill="#e3f2ee" />
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(54 ${56 + row * 30})`}>
          <rect width="88" height="6" rx="3" fill="#efe9df" />
          {["A", "B", "C", "D"].map((letter, i) => (
            <g key={letter} transform={`translate(${i * 22} 12)`}>
              <circle
                cx="7"
                cy="7"
                r="7"
                fill={i === (row + 1) % 4 ? "#0f6e5c" : "#fff"}
                stroke="#0f6e5c"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </g>
      ))}
      <path
        d="M120 112h18l8-20 12 40 10-28 6 8h30"
        stroke="#e07a3f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="186" cy="38" r="16" fill="#fff4dc" />
      <path d="M180 38l4 4 8-9" stroke="#9a5b00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmptyLessonsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden fill="none">
      <rect x="20" y="22" width="90" height="70" rx="10" fill="#fff" stroke="#e4ddd2" strokeWidth="2" />
      <rect x="34" y="38" width="50" height="6" rx="3" fill="#e3f2ee" />
      <rect x="34" y="52" width="62" height="5" rx="2.5" fill="#efe9df" />
      <rect x="34" y="63" width="40" height="5" rx="2.5" fill="#efe9df" />
      <circle cx="118" cy="78" r="22" fill="#0f6e5c" />
      <path d="M118 68v20M108 78h20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
