import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerWheelProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPickerWheel({ value, onChange, className }: ColorPickerWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;

    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw center white circle for lightness
    const innerRadius = radius * 0.15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }, []);

  const getColorAtPosition = (x: number, y: number): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '#000000';

    const rect = canvas.getBoundingClientRect();
    const canvasX = (x - rect.left) * (canvas.width / rect.width);
    const canvasY = (y - rect.top) * (canvas.height / rect.height);

    const imageData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Check if within circle bounds
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));

    if (distance <= radius) {
      setPosition({ x: clientX - rect.left, y: clientY - rect.top });
      const color = getColorAtPosition(clientX, clientY);
      onChange(color);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="cursor-crosshair rounded-full shadow-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        />
        {/* Picker indicator */}
        <div
          className="absolute w-5 h-5 border-2 border-white rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: position.x,
            top: position.y,
            backgroundColor: value || '#000000',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)'
          }}
        />
      </div>
      
      {/* Selected color display */}
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-border shadow-inner"
          style={{ backgroundColor: value || '#000000' }}
        />
        <span className="font-mono text-sm text-muted-foreground">
          {value || '#000000'}
        </span>
      </div>
    </div>
  );
}
