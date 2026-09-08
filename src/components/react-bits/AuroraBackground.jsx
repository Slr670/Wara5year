import React from 'react';

export function AuroraBackground({ children, className = '' }) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {/* Beam 1 */}
        <div className="absolute top-[-10%] left-[15%] w-[45vw] h-[35vw] rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-transparent blur-[120px] animate-aurora-1" />
        {/* Beam 2 */}
        <div className="absolute top-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-bl from-purple-600/15 via-blue-700/10 to-transparent blur-[140px] animate-aurora-2" />
        {/* Grid dots */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
