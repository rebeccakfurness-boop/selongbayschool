'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  toDataUrl: () => string;
  clear: () => void;
}

const WIDTH = 400;
const HEIGHT = 150;

/** Plain <canvas> pointer-event drawing pad — no external signature library needed for something
 * this simple. Produces a transparent-background PNG data URL, embedded directly into the
 * generated compliance form PDF (see ComplianceFormDocument.tsx). */
const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [isEmptyState, setIsEmptyState] = useState(true);

  function context() {
    return canvasRef.current?.getContext('2d') ?? null;
  }

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = context();
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = context();
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#17282b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setIsEmptyState(false);
    }
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasDrawnRef.current,
    toDataUrl: () => canvasRef.current?.toDataURL('image/png') ?? '',
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = context();
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = false;
      setIsEmptyState(true);
    },
  }));

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="touch-none rounded-sm border border-sand-line bg-white"
        style={{ width: '100%', maxWidth: WIDTH, height: HEIGHT }}
      />
      {isEmptyState && <p className="mt-1 text-xs text-ink-soft">Draw your signature above.</p>}
    </div>
  );
});

export default SignaturePad;
