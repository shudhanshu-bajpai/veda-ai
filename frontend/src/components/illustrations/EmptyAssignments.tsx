interface Props {
  className?: string;
}

export default function EmptyAssignments({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soft circular background */}
      <circle cx="120" cy="120" r="110" fill="#F3F0EC" />

      {/* Decorative sparkles */}
      <g opacity="0.9">
        <path
          d="M40 105 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z"
          fill="#C9B89F"
        />
        <path
          d="M205 75 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 z"
          fill="#9AB5C9"
        />
        <circle cx="60" cy="160" r="3" fill="#D4C5B0" />
        <circle cx="195" cy="155" r="2.5" fill="#B8C9D4" />
      </g>

      {/* Decorative squiggle */}
      <path
        d="M68 70 q12 -14 24 -2 q12 14 24 -4 q8 -10 16 -2"
        stroke="#2D2D2D"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clipboard/Document */}
      <g>
        {/* Back doc shadow */}
        <rect
          x="84"
          y="78"
          width="84"
          height="110"
          rx="6"
          fill="#E8E0D4"
        />
        {/* Front doc */}
        <rect
          x="78"
          y="72"
          width="84"
          height="110"
          rx="6"
          fill="#FFFFFF"
          stroke="#E2DBCF"
          strokeWidth="1.5"
        />
        {/* Document corner fold */}
        <path
          d="M150 72 l12 12 h-9 a3 3 0 0 1 -3 -3 z"
          fill="#E8E0D4"
          stroke="#E2DBCF"
          strokeWidth="1.5"
        />
        {/* Small label tag at top */}
        <rect
          x="148"
          y="62"
          width="32"
          height="14"
          rx="3"
          fill="#FFFFFF"
          stroke="#E2DBCF"
          strokeWidth="1.5"
        />
        <line
          x1="153"
          y1="69"
          x2="167"
          y2="69"
          stroke="#C9BFB0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Text lines on doc */}
        <line
          x1="90"
          y1="98"
          x2="118"
          y2="98"
          stroke="#D4C9B7"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="90"
          y1="110"
          x2="135"
          y2="110"
          stroke="#E2DBCF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Red X mark in circle */}
      <g>
        <circle
          cx="120"
          cy="138"
          r="22"
          fill="#FEE4E2"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <path
          d="M110 128 l20 20 M130 128 l-20 20"
          stroke="#E5484D"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>

      {/* Magnifying glass */}
      <g>
        <circle
          cx="155"
          cy="148"
          r="18"
          fill="#FFFFFF"
          stroke="#9F94B8"
          strokeWidth="3"
        />
        <circle
          cx="155"
          cy="148"
          r="14"
          fill="#E4DBF4"
          fillOpacity="0.6"
        />
        <path
          d="M170 163 l12 12"
          stroke="#9F94B8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Glass highlight */}
        <path
          d="M148 142 q2 -4 8 -4"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
