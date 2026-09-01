import React from 'react';

interface ZentavoLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emerald' | 'dark' | 'light';
  showText?: boolean;
}

export const ZentavoIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-6 h-6",
  size = 32
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zentavo Logo"
    >
      <defs>
        <linearGradient id="zentavoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="zentavoGradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
        <linearGradient id="zentavoGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#09090B" />
        </linearGradient>
        <filter id="zentavoShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" floodColor="#047857" />
        </filter>
      </defs>

      {/* Rounded Hexagonal / Coin Container Shape */}
      <rect 
        x="6" 
        y="6" 
        width="88" 
        height="88" 
        rx="26" 
        fill="url(#zentavoGradDark)" 
      />
      <rect 
        x="7" 
        y="7" 
        width="86" 
        height="86" 
        rx="25" 
        stroke="rgba(255,255,255,0.12)" 
        strokeWidth="1.5" 
      />

      {/* Outer Zen Circle segment */}
      <path 
        d="M 50,20 A 30,30 0 1,1 21.5,58" 
        stroke="url(#zentavoGradAccent)" 
        strokeWidth="5.5" 
        strokeLinecap="round" 
        strokeDasharray="95 15"
      />

      {/* Stylized Modern 'Z' Vector Geometry inside Coin */}
      {/* Top Z bar */}
      <path 
        d="M 32 36 L 68 36 C 70.2 36 71.5 38.3 70.3 40.1 L 45 70" 
        stroke="url(#zentavoGradPrimary)" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter="url(#zentavoShadow)"
      />

      {/* Bottom Z bar */}
      <path 
        d="M 32 64 L 68 64" 
        stroke="url(#zentavoGradAccent)" 
        strokeWidth="7" 
        strokeLinecap="round" 
      />

      {/* Center Dynamic Growth Sparkle / Coin Node */}
      <circle cx="67" cy="36" r="3.5" fill="#A7F3D0" />
      <circle cx="33" cy="64" r="3.5" fill="#34D399" />
    </svg>
  );
};

export const ZentavoLogo: React.FC<ZentavoLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  const sizeMap = {
    xs: { icon: 22, text: "text-sm", box: "w-6 h-6" },
    sm: { icon: 28, text: "text-base", box: "w-7 h-7" },
    md: { icon: 36, text: "text-lg", box: "w-9 h-9" },
    lg: { icon: 44, text: "text-xl", box: "w-11 h-11" },
    xl: { icon: 56, text: "text-2xl", box: "w-14 h-14" },
  };

  const { icon, text, box } = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      <div className={`${box} flex items-center justify-center shrink-0`}>
        <ZentavoIcon size={icon} className="w-full h-full" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`font-extrabold tracking-tight text-zinc-900 ${text}`}>
              Zentavo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZentavoLogo;
