import React from "react";

interface PremiumLogoProps {
  className?: string;
}

export default function PremiumLogo({ className = "w-full" }: PremiumLogoProps) {
  return (
    <div id="premium-tournament-logo" className={`flex flex-col items-center justify-center text-center ${className}`}>
      <svg
        viewBox="0 0 240 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-40 h-auto filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.15)] hover:scale-105 transition-transform duration-500 ease-out cursor-pointer"
      >
        <defs>
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
          <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Glow */}
        <circle cx="120" cy="70" r="45" fill="url(#gold-glow)" />

        {/* Elegant Championship Stars Arc */}
        <g fill="url(#gold-grad)">
          <path d="M75,50 L77,54 L81,54 L78,57 L79,61 L75,59 L71,61 L72,57 L69,54 L73,54 Z" />
          <path d="M92,34 L94,38 L98,38 L95,41 L96,45 L92,43 L88,45 L89,41 L86,38 L90,38 Z" transform="scale(1.1) translate(-10, -5)" />
          <path d="M120,20 L122.5,25 L127.5,25 L123.5,28.5 L125,33.5 L120,31 L115,33.5 L116.5,28.5 L112.5,25 L117.5,25 Z" className="animate-pulse" />
          <path d="M148,34 L150,38 L154,38 L151,41 L152,45 L148,43 L144,45 L145,41 L142,38 L146,38 Z" transform="scale(1.1) translate(-15, -5)" />
          <path d="M165,50 L167,54 L171,54 L168,57 L169,61 L165,59 L161,61 L162,57 L159,54 L163,54 Z" />
        </g>

        {/* Global Longitude/Latitude lines (Football texture behind trophy) */}
        <circle cx="120" cy="75" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <ellipse cx="120" cy="75" rx="15" ry="30" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="90" y1="75" x2="150" y2="75" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

        {/* Golden Trophy Path (Highly elegant, luxury contour) */}
        {/* Base */}
        <path d="M102,112 L138,112 L134,118 L106,118 Z" fill="url(#gold-grad)" />
        <path d="M95,118 L145,118 L141,123 L99,123 Z" fill="url(#gold-grad)" />
        
        {/* Stem */}
        <path d="M115,92 L125,92 L127,112 L113,112 Z" fill="url(#gold-grad)" />
        <circle cx="120" cy="100" r="4" fill="#FFFFFF" opacity="0.3" />

        {/* Bowl */}
        <path d="M100,60 C100,85 108,92 120,92 C132,92 140,85 140,60 C140,54 135,50 120,50 C105,50 100,54 100,60 Z" fill="url(#gold-grad)" />
        
        {/* Bowl Details & Highlights */}
        <path d="M103,58 C103,78 110,88 120,88 C130,88 137,78 137,58 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
        {/* Crown/Rim of Bowl */}
        <ellipse cx="120" cy="50" rx="20" ry="3.5" fill="url(#gold-grad)" />
        <ellipse cx="120" cy="50" rx="17" ry="2" fill="#FFE082" opacity="0.5" />

        {/* Left Ear/Handle */}
        <path d="M100,58 C92,58 90,75 104,82 C101,75 99,65 101,60 Z" fill="url(#gold-grad)" stroke="url(#gold-grad)" strokeWidth="1" />
        {/* Right Ear/Handle */}
        <path d="M140,58 C148,58 150,75 136,82 C139,75 141,65 139,60 Z" fill="url(#gold-grad)" stroke="url(#gold-grad)" strokeWidth="1" />

        {/* Miniature Football embedded in bowl */}
        <circle cx="120" cy="66" r="8" fill="#111827" stroke="url(#gold-grad)" strokeWidth="1.5" />
        <polygon points="120,62.5 123.5,65 122,69 118,69 116.5,65" fill="url(#gold-grad)" />
        <line x1="120" y1="62.5" x2="120" y2="58" stroke="url(#gold-grad)" strokeWidth="1" />
        <line x1="123.5" y1="65" x2="128" y2="66" stroke="url(#gold-grad)" strokeWidth="1" />
        <line x1="122" y1="69" x2="125" y2="73" stroke="url(#gold-grad)" strokeWidth="1" />
        <line x1="118" y1="69" x2="115" y2="73" stroke="url(#gold-grad)" strokeWidth="1" />
        <line x1="116.5" y1="65" x2="112" y2="66" stroke="url(#gold-grad)" strokeWidth="1" />
      </svg>

      {/* Typography Styling */}
      <div className="mt-1 space-y-0.5">
        <h2 className="text-lg font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFF8E1] to-amber-100 uppercase font-sans leading-none">
          WORLD CUP 2026
        </h2>
        <p className="text-[9px] font-black tracking-[0.35em] text-amber-400 uppercase leading-none">
          SEMI FINAL PREDICTION
        </p>
      </div>
    </div>
  );
}
