import React from 'react';

interface ZentavoLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'copper' | 'emerald' | 'gold';
  showText?: boolean;
}

export const ZentavoIcon: React.FC<{ 
  className?: string; 
  size?: number;
  variant?: 'copper' | 'emerald' | 'gold';
}> = ({ 
  className = "w-6 h-6",
  size = 32,
  variant = 'copper'
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={`select-none shrink-0 ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Centavo SV Logo"
    >
      <defs>
        {/* Copper / Bronze Penny Gradients */}
        <linearGradient id="centavoRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="20%" stopColor="#F59E0B" />
          <stop offset="45%" stopColor="#D97706" />
          <stop offset="75%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <radialGradient id="centavoFaceGrad" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="25%" stopColor="#FBBF24" />
          <stop offset="55%" stopColor="#D97706" />
          <stop offset="85%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>

        <linearGradient id="centavoBevelInner" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78350F" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="centavoTextFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FEF3C7" />
          <stop offset="80%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <linearGradient id="centavoSheen" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.0" />
          <stop offset="70%" stopColor="#451A03" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#451A03" stopOpacity="0.4" />
        </linearGradient>

        {/* Drop shadow for 3D minted coin depth */}
        <filter id="centavoShadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.35" floodColor="#451A03" />
        </filter>

        {/* Emboss shadow for minted SV lettering */}
        <filter id="centavoEmboss" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="0.7" floodOpacity="0.85" floodColor="#451A03" />
        </filter>

        {/* Arched text paths */}
        <path id="centavoArcTop" d="M 21,50 A 29,29 0 0,1 79,50" fill="none" />
        <path id="centavoArcBottom" d="M 23,50 A 27,27 0 0,0 77,50" fill="none" />
      </defs>

      {/* Main Coin Group with Shadow */}
      <g filter="url(#centavoShadow)">
        {/* 1. Outer Stepped Rim */}
        <circle cx="50" cy="50" r="47" fill="url(#centavoRimGrad)" />
        <circle cx="50" cy="50" r="46.5" stroke="#FDE68A" strokeWidth="0.8" strokeOpacity="0.6" />

        {/* 2. Coin Edge Reeded / Beaded Ring (Puntos de acuñación de moneda) */}
        <circle 
          cx="50" 
          cy="50" 
          r="43" 
          stroke="#78350F" 
          strokeWidth="1.8" 
          strokeDasharray="1.2 3.2" 
          strokeLinecap="round" 
          opacity="0.85"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="43" 
          stroke="#FEF3C7" 
          strokeWidth="0.8" 
          strokeDasharray="1.2 3.2" 
          strokeLinecap="round" 
          strokeDashoffset="0.4"
          opacity="0.9"
        />

        {/* 3. Inner Bevel Groove */}
        <circle cx="50" cy="50" r="39.5" stroke="url(#centavoBevelInner)" strokeWidth="1.2" />

        {/* 4. Recessed Coin Face (Campo de la moneda) */}
        <circle cx="50" cy="50" r="39" fill="url(#centavoFaceGrad)" />

        {/* 5. Subtle Inner Mint Ring */}
        <circle cx="50" cy="50" r="33.5" stroke="#78350F" strokeWidth="0.75" strokeOpacity="0.5" />
        <circle cx="50" cy="50" r="33" stroke="#FEF3C7" strokeWidth="0.5" strokeOpacity="0.6" />

        {/* 6. Arched Mint Text: "CENTAVO" */}
        <text 
          fill="url(#centavoTextFill)" 
          fontSize="7" 
          fontWeight="800" 
          letterSpacing="2.8px"
          style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif" }}
          filter="url(#centavoEmboss)"
        >
          <textPath href="#centavoArcTop" xlinkHref="#centavoArcTop" startOffset="50%" textAnchor="middle">
            CENTAVO
          </textPath>
        </text>

        {/* 7. Central Minted Relief: "SV" */}
        {/* Minted highlight shadow backplate */}
        <text 
          x="50" 
          y="56" 
          textAnchor="middle" 
          dominantBaseline="central"
          fontSize="27" 
          fontWeight="900" 
          letterSpacing="1px"
          fill="#451A03"
          opacity="0.8"
          style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          SV
        </text>
        {/* Minted light edge backplate */}
        <text 
          x="49.4" 
          y="53.8" 
          textAnchor="middle" 
          dominantBaseline="central"
          fontSize="27" 
          fontWeight="900" 
          letterSpacing="1px"
          fill="#FFFBEB"
          opacity="0.9"
          style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          SV
        </text>
        {/* Main embossed text */}
        <text 
          x="50" 
          y="54.5" 
          textAnchor="middle" 
          dominantBaseline="central"
          fontSize="27" 
          fontWeight="900" 
          letterSpacing="1px"
          fill="url(#centavoTextFill)"
          style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif" }}
          filter="url(#centavoEmboss)"
        >
          SV
        </text>

        {/* 8. Bottom Arched Mint Detail: "★ 1 ¢ ★" */}
        <text 
          fill="url(#centavoTextFill)" 
          fontSize="6.2" 
          fontWeight="800" 
          letterSpacing="3px"
          style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif" }}
          filter="url(#centavoEmboss)"
        >
          <textPath href="#centavoArcBottom" xlinkHref="#centavoArcBottom" startOffset="50%" textAnchor="middle">
            ★ 1 ¢ ★
          </textPath>
        </text>

        {/* 9. Metallic Coin Sheen & Highlight Arc Overlay */}
        <circle cx="50" cy="50" r="39" fill="url(#centavoSheen)" pointerEvents="none" />
      </g>
    </svg>
  );
};

export const ZentavoLogo: React.FC<ZentavoLogoProps> = ({
  className = "",
  size = "md",
  variant = "copper",
  showText = true,
}) => {
  const sizeMap = {
    xs: { icon: 24, text: "text-sm", box: "w-6 h-6", badge: "text-[9px] px-1 py-0.2" },
    sm: { icon: 30, text: "text-base", box: "w-7 h-7", badge: "text-[10px] px-1.5 py-0.5" },
    md: { icon: 38, text: "text-lg", box: "w-9 h-9", badge: "text-[11px] px-1.5 py-0.5" },
    lg: { icon: 46, text: "text-xl", box: "w-11 h-11", badge: "text-xs px-2 py-0.5" },
    xl: { icon: 58, text: "text-2xl", box: "w-14 h-14", badge: "text-xs px-2.5 py-1" },
  };

  const { icon, text, box, badge } = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      <div className={`${box} flex items-center justify-center shrink-0`}>
        <ZentavoIcon size={icon} variant={variant} className="w-full h-full" />
      </div>
      {showText && (
        <div className="flex items-center space-x-1.5">
          <span className={`font-extrabold tracking-tight text-zinc-900 ${text}`}>
            Zentavo
          </span>
          <span className={`font-bold tracking-wide rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 ${badge}`}>
            SV
          </span>
        </div>
      )}
    </div>
  );
};

export default ZentavoLogo;

