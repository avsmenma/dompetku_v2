/**
 * AccountLogo — Menampilkan logo brand bank/e-wallet atau fallback inisial.
 * Cocokkan berdasarkan nama akun (case-insensitive).
 */

interface AccountLogoProps {
  name: string;
  color: string;
  size?: "sm" | "md"; // sm=w-10 h-10, md=w-12 h-12
}

// Brand definitions: keyword -> { bg, logo SVG path or emoji fallback }
const BRAND_MAP: Array<{
  keys: string[];
  bg: string;
  fg: string;
  logo: React.ReactNode;
}> = [
  // ── E-Wallets ──────────────────────────────────────────────
  {
    keys: ["gopay", "go-pay"],
    bg: "#00AED6",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-2">
        <circle cx="24" cy="24" r="20" fill="#fff" />
        <text x="24" y="30" fontSize="16" fontWeight="bold" fill="#00AED6" textAnchor="middle">GP</text>
      </svg>
    ),
  },
  {
    keys: ["ovo"],
    bg: "#4C3494",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="4" y="12" width="40" height="24" rx="12" fill="#fff" />
        <text x="24" y="29" fontSize="13" fontWeight="bold" fill="#4C3494" textAnchor="middle">OVO</text>
      </svg>
    ),
  },
  {
    keys: ["dana"],
    bg: "#1782FB",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="8" fill="#fff" />
        <text x="24" y="29" fontSize="14" fontWeight="bold" fill="#1782FB" textAnchor="middle">DANA</text>
      </svg>
    ),
  },
  {
    keys: ["shopeepay", "shopee pay", "shopee"],
    bg: "#EE4D2D",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-2">
        <circle cx="24" cy="24" r="18" fill="#fff" />
        <text x="24" y="30" fontSize="11" fontWeight="bold" fill="#EE4D2D" textAnchor="middle">SPay</text>
      </svg>
    ),
  },
  // ── Banks ──────────────────────────────────────────────────
  {
    keys: ["bri", "bank rakyat", "rakyat indonesia"],
    bg: "#003d79",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#003d79" />
        <text x="24" y="29" fontSize="14" fontWeight="bold" fill="#fff" textAnchor="middle">BRI</text>
      </svg>
    ),
  },
  {
    keys: ["bni", "bank negara", "negara indonesia"],
    bg: "#F37021",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#F37021" />
        <text x="24" y="29" fontSize="14" fontWeight="bold" fill="#fff" textAnchor="middle">BNI</text>
      </svg>
    ),
  },
  {
    keys: ["mandiri", "bank mandiri"],
    bg: "#003087",
    fg: "#FFD700",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#003087" />
        <text x="24" y="29" fontSize="11" fontWeight="bold" fill="#FFD700" textAnchor="middle">MANDIRI</text>
      </svg>
    ),
  },
  {
    keys: ["bca", "bank central asia", "central asia"],
    bg: "#005BAC",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#005BAC" />
        <text x="24" y="29" fontSize="14" fontWeight="bold" fill="#fff" textAnchor="middle">BCA</text>
      </svg>
    ),
  },
  {
    keys: ["cimb", "cimb niaga", "niaga"],
    bg: "#C01019",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#C01019" />
        <text x="24" y="29" fontSize="12" fontWeight="bold" fill="#fff" textAnchor="middle">CIMB</text>
      </svg>
    ),
  },
  {
    keys: ["jago", "bank jago"],
    bg: "#00B14F",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#00B14F" />
        <text x="24" y="29" fontSize="13" fontWeight="bold" fill="#fff" textAnchor="middle">Jago</text>
      </svg>
    ),
  },
  {
    keys: ["bsi", "bank syariah", "syariah indonesia"],
    bg: "#00573F",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
        <rect x="2" y="10" width="44" height="28" rx="6" fill="#00573F" />
        <text x="24" y="29" fontSize="14" fontWeight="bold" fill="#fff" textAnchor="middle">BSI</text>
      </svg>
    ),
  },
  // ── Cash ───────────────────────────────────────────────────
  {
    keys: ["tunai", "cash", "uang tunai", "wallet", "dompet"],
    bg: "#22c55e",
    fg: "#fff",
    logo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-2">
        <circle cx="24" cy="24" r="18" fill="#fff" fillOpacity="0.2" />
        {/* Wallet icon */}
        <rect x="10" y="15" width="28" height="18" rx="3" stroke="#fff" strokeWidth="2.5" fill="none" />
        <rect x="28" y="21" width="8" height="6" rx="3" fill="#fff" />
      </svg>
    ),
  },
];

function findBrand(name: string) {
  const lower = name.toLowerCase();
  return BRAND_MAP.find((b) => b.keys.some((k) => lower.includes(k)));
}

export function AccountLogo({ name, color, size = "md" }: AccountLogoProps) {
  const brand = findBrand(name);
  const sizeClass = size === "sm" ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-2xl";

  if (brand) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center overflow-hidden flex-shrink-0`}
        style={{ backgroundColor: brand.bg }}
      >
        {brand.logo}
      </div>
    );
  }

  // Fallback: colored initial avatar
  return (
    <div
      className={`${sizeClass} flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: color, fontSize: size === "sm" ? "14px" : "18px" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
