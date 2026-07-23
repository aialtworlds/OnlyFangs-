import { useState, useRef, useEffect } from 'react';
import { Lock, Play, X, Move } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  cropType: 'avatar' | 'cover';
  onClose: () => void;
  onConfirm: (croppedBase64: string) => void;
}

export function ImageCropperModal({ imageSrc, cropType, onClose, onConfirm }: ImageCropperModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y
    });
  };

  const handleCrop = () => {
    if (!imageRef.current || !viewportRef.current) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const exportWidth = cropType === 'avatar' ? 400 : 1200;
      const exportHeight = cropType === 'avatar' ? 400 : 300;

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const imageRect = imageRef.current!.getBoundingClientRect();
        const viewportRect = viewportRef.current!.getBoundingClientRect();
        const naturalScale = img.naturalWidth / imageRect.width;

        const sx = (viewportRect.left - imageRect.left) * naturalScale;
        const sy = (viewportRect.top - imageRect.top) * naturalScale;
        const sw = viewportRect.width * naturalScale;
        const sh = viewportRect.height * naturalScale;

        // Draw image onto canvas
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, exportWidth, exportHeight);

        // Export as base64 string
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        onConfirm(croppedBase64);
      }
    };
  };

  // Center image initially when loaded
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  }, [imageSrc]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'oklch(0.04 0.008 285 / 85%)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'oklch(0.085 0.015 330)',
          border: '1px solid oklch(0.72 0.09 75 / 20%)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
          boxShadow: '0 20px 50px oklch(0 0 0 / 80%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '16px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'oklch(0.93 0.02 80)',
              margin: 0,
            }}
          >
            Refine Image Framing
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'oklch(0.55 0.03 60)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cropping Area */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          style={{
            position: 'relative',
            height: '300px',
            background: '#040405',
            borderRadius: '4px',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Viewport Mask */}
          <div
            ref={viewportRef}
            style={{
              position: 'absolute',
              width: cropType === 'avatar' ? '200px' : '360px',
              height: cropType === 'avatar' ? '200px' : '90px',
              borderRadius: cropType === 'avatar' ? '50%' : '4px',
              border: '2px solid oklch(0.72 0.09 75)',
              boxShadow: '0 0 0 9999px oklch(0.04 0.008 285 / 75%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Underlay Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source"
            draggable={false}
            style={{
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              userSelect: 'none',
              pointerEvents: 'none',
              transition: isDragging ? 'none' : 'transform 0.1s ease',
            }}
          />

          {/* Drag Help Icon overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'oklch(0.085 0.015 330 / 80%)',
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: 'oklch(0.55 0.03 60)',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.05em',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          >
            <Move size={10} /> Drag to position
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: "'Cinzel', serif", color: 'oklch(0.55 0.03 60)' }}>
            <span>ZOOM</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'oklch(0.72 0.09 75)',
              background: 'oklch(0.12 0.02 285)',
              height: '4px',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 18px',
              background: 'transparent',
              border: '1px solid oklch(0.72 0.09 75 / 30%)',
              color: 'oklch(0.72 0.09 75)',
              borderRadius: '4px',
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75 / 5%)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            style={{
              flex: 1,
              padding: '12px 18px',
              background: 'oklch(0.72 0.09 75)',
              border: '1px solid oklch(0.72 0.09 75)',
              color: 'oklch(0.04 0.008 285)',
              borderRadius: '4px',
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.8 0.1 75)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75)';
            }}
          >
            Apply & Upload
          </button>
        </div>
      </div>
    </div>
  );
}
