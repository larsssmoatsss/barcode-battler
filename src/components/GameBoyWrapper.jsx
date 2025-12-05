// GameBoyWrapper.jsx
// Simple wrapper with game window, title above, credit below

// Game Boy Color Palette - ONLY these 4 colors for authenticity
export const GB_COLORS = {
  lightest: '#9bbc0f',  // Background, highlights
  light: '#8bac0f',     // Secondary elements
  dark: '#306230',      // Text, borders
  darkest: '#0f380f',   // Darkest shadows, strong emphasis
};

// Game Boy shell colors for theming
const SHELL_COLORS = {
  body: '#C0C0C0',      // Classic Game Boy grey
  dpad: '#2a2a2a',      // D-pad black
  select: '#5a5a5a',    // Select/Start grey
  buttons: '#8b2252',   // A/B button red
};

// Game Boy screen is 160x144 pixels, we scale it up for modern displays
const SCALE = 3;
const SCREEN_WIDTH = 160 * SCALE;  // 480px
const SCREEN_HEIGHT = 144 * SCALE; // 432px

export default function GameBoyWrapper({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh', // Dynamic viewport height for mobile
      backgroundColor: SHELL_COLORS.body,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      boxSizing: 'border-box',
      fontFamily: '"Press Start 2P", monospace',
      overflow: 'hidden',
    }}>
      {/* Title above screen */}
      <div style={{
        color: GB_COLORS.darkest,
        fontSize: 'clamp(10px, 3.5vw, 16px)',
        letterSpacing: 'clamp(2px, 1vw, 4px)',
        marginBottom: 'clamp(5px, 1.5vw, 15px)',
        textShadow: `2px 2px 0 ${GB_COLORS.dark}`,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        BARCODE BATTLER
      </div>

      {/* Game screen with border - constrained to fit viewport */}
      <div style={{
        width: '100%',
        maxWidth: SCREEN_WIDTH,
        maxHeight: 'calc(100dvh - 80px)', // Leave room for title and credit
        aspectRatio: '160 / 144',
        backgroundColor: GB_COLORS.lightest,
        border: `clamp(3px, 1vw, 6px) solid ${GB_COLORS.darkest}`,
        boxShadow: `0 0 0 clamp(1px, 0.5vw, 3px) ${GB_COLORS.dark}, 0 8px 24px rgba(0,0,0,0.3)`,
        overflow: 'hidden',
        imageRendering: 'pixelated',
        position: 'relative',
        touchAction: 'manipulation',
      }}>
        {children}
      </div>

      {/* Credit below screen - Game Boy button colors! */}
      <div style={{
        fontSize: 'clamp(7px, 2vw, 10px)',
        letterSpacing: '2px',
        marginTop: 'clamp(5px, 1.5vw, 15px)',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1vw, 8px)',
        flexShrink: 0,
      }}>
        <span style={{ color: SHELL_COLORS.dpad }}>BY LARS</span>
        <span style={{ color: SHELL_COLORS.select }}>·</span>
        <span style={{ color: SHELL_COLORS.buttons }}>2025</span>
      </div>
    </div>
  );
}

// Reusable UI Components for Game Boy style

// Text Box - Pokemon style dialog/menu box
export function GBTextBox({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: GB_COLORS.lightest,
      border: `3px solid ${GB_COLORS.darkest}`,
      padding: '8px',
      fontSize: '10px',
      lineHeight: 1.6,
      color: GB_COLORS.darkest,
      ...style,
    }}>
      {children}
    </div>
  );
}

// Menu Item with cursor
export function GBMenuItem({ children, selected, onClick, disabled }) {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        color: GB_COLORS.darkest,
        fontSize: '10px',
      }}
    >
      <span style={{ 
        width: '12px', 
        marginRight: '4px',
        visibility: selected ? 'visible' : 'hidden'
      }}>
        ▶
      </span>
      {children}
    </div>
  );
}

// HP Bar component
export function GBHPBar({ current, max, width = 80 }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <span style={{ fontSize: '8px', color: GB_COLORS.darkest }}>HP</span>
      <div style={{
        width: width,
        height: '6px',
        backgroundColor: GB_COLORS.light,
        border: `1px solid ${GB_COLORS.darkest}`,
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: percentage > 50 ? GB_COLORS.dark : 
                          percentage > 20 ? GB_COLORS.dark : GB_COLORS.darkest,
        }} />
      </div>
    </div>
  );
}

// Simple divider line
export function GBDivider() {
  return (
    <div style={{
      height: '2px',
      backgroundColor: GB_COLORS.dark,
      margin: '4px 0',
    }} />
  );
}