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
      width: '100%',
      minHeight: '100vh',
      minHeight: '100dvh',
      backgroundColor: SHELL_COLORS.body,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      boxSizing: 'border-box',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      {/* Title above screen */}
      <div style={{
        color: GB_COLORS.darkest,
        fontSize: '14px',
        letterSpacing: '3px',
        marginBottom: '8px',
        textShadow: `2px 2px 0 ${GB_COLORS.dark}`,
        textAlign: 'center',
      }}>
        BARCODE BATTLER
      </div>

      {/* Game screen - fixed max size, shrinks on small screens */}
      <div style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: 'calc(100vh - 100px)',
        aspectRatio: '160 / 144',
        backgroundColor: GB_COLORS.lightest,
        border: `4px solid ${GB_COLORS.darkest}`,
        boxShadow: `0 0 0 2px ${GB_COLORS.dark}`,
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}>
        {children}
      </div>

      {/* Credit below screen */}
      <div style={{
        fontSize: '9px',
        letterSpacing: '1px',
        marginTop: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
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