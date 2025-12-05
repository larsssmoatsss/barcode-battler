import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

// GameBoy Color Palette
const GB = {
  lightest: '#9bbc0f',
  light: '#8bac0f',
  dark: '#306230',
  darkest: '#0f380f',
};

export default function BarcodeScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setIsScanning(true);
    setShowManual(false);

    try {
      const codeReader = codeReaderRef.current;
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      const selectedDevice = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            console.log('Scanned barcode:', barcode);
            stopScanning();
            if (onScan) {
              onScan(barcode);
            }
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError(err.message);
      setIsScanning(false);
      
      if (onError) {
        onError(err);
      }
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const cleaned = manualCode.replace(/[\s\-]/g, '');
    if (cleaned.length >= 6 && /^\d+$/.test(cleaned)) {
      setManualCode('');
      setShowManual(false);
      if (onScan) {
        onScan(cleaned);
      }
    } else {
      setError('Invalid code!');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      padding: '8px',
      backgroundColor: GB.lightest,
    }}>
      {!showManual ? (
        <>
          {/* Scanner Viewfinder */}
          <div style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            maxHeight: '200px',
            backgroundColor: GB.darkest,
            border: `4px solid ${GB.darkest}`,
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            {/* Video element */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            
            {/* Green Game Boy tint overlay - doesn't affect scanning! */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: GB.light,
              opacity: 0.3,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }} />

            {/* Scan line effect when active */}
            {isScanning && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '10%',
                right: '10%',
                height: '3px',
                backgroundColor: GB.darkest,
                boxShadow: `0 0 8px ${GB.darkest}`,
                animation: 'scanline 2s ease-in-out infinite',
              }} />
            )}

            {/* Corner brackets for viewfinder look */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              width: '20px',
              height: '20px',
              borderTop: `3px solid ${GB.darkest}`,
              borderLeft: `3px solid ${GB.darkest}`,
            }} />
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              width: '20px',
              height: '20px',
              borderTop: `3px solid ${GB.darkest}`,
              borderRight: `3px solid ${GB.darkest}`,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '15px',
              width: '20px',
              height: '20px',
              borderBottom: `3px solid ${GB.darkest}`,
              borderLeft: `3px solid ${GB.darkest}`,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '15px',
              right: '15px',
              width: '20px',
              height: '20px',
              borderBottom: `3px solid ${GB.darkest}`,
              borderRight: `3px solid ${GB.darkest}`,
            }} />

            {/* Camera off overlay */}
            {!isScanning && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: GB.dark,
                color: GB.lightest,
                fontSize: '10px',
              }}>
                CAMERA OFF
              </div>
            )}
          </div>

          {/* Status text */}
          <div style={{
            backgroundColor: GB.lightest,
            border: `3px solid ${GB.darkest}`,
            padding: '8px',
            width: '100%',
            textAlign: 'center',
            marginBottom: '8px',
            fontSize: '9px',
            color: GB.darkest,
          }}>
            {isScanning ? 'Scanning...' : 'Ready to scan'}
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
          }}>
            <GBScanButton 
              onClick={isScanning ? stopScanning : startScanning}
              active={isScanning}
            >
              {isScanning ? 'STOP' : 'SCAN'}
            </GBScanButton>
            
            <GBScanButton 
              onClick={() => { stopScanning(); setShowManual(true); setError(null); }}
            >
              TYPE
            </GBScanButton>
          </div>
        </>
      ) : (
        /* Manual Entry Mode */
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            backgroundColor: GB.lightest,
            border: `3px solid ${GB.darkest}`,
            padding: '8px',
            textAlign: 'center',
            fontSize: '9px',
            color: GB.darkest,
          }}>
            Enter barcode digits:
          </div>
          
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="0123456789"
            style={{
              padding: '12px',
              fontSize: '14px',
              fontFamily: '"Press Start 2P", monospace',
              textAlign: 'center',
              border: `3px solid ${GB.darkest}`,
              backgroundColor: GB.lightest,
              color: GB.darkest,
              letterSpacing: '2px',
              outline: 'none',
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleManualSubmit(e);
              }
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <GBScanButton onClick={() => { setShowManual(false); setError(null); }}>
              BACK
            </GBScanButton>
            <GBScanButton onClick={handleManualSubmit} active>
              OK
            </GBScanButton>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: GB.light,
          border: `3px solid ${GB.darkest}`,
          color: GB.darkest,
          fontSize: '9px',
          textAlign: 'center',
          width: '100%',
        }}>
          ERROR: {error}
        </div>
      )}

      {/* CSS for scan animation */}
      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-30px); }
          50% { transform: translateY(30px); }
        }
      `}</style>
    </div>
  );
}

function GBScanButton({ onClick, children, active = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px',
        fontSize: '10px',
        fontFamily: '"Press Start 2P", monospace',
        backgroundColor: active ? GB.dark : GB.light,
        color: active ? GB.lightest : GB.darkest,
        border: `3px solid ${GB.darkest}`,
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      {children}
    </button>
  );
}