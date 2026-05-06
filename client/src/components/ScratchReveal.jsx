import { useCallback, useEffect, useRef, useState } from "react";

const defaultBrushSize = 54;
const defaultRevealThreshold = 45;

// ScratchReveal places a canvas over its children.
// The canvas acts like a removable cover: drawing with destination-out erases it.
export default function ScratchReveal({
  brushSize = defaultBrushSize,
  children,
  className = "",
  coverSubtitle = "Swipe to Reveal",
  coverTitle = "Scratch to reveal",
  onComplete,
  onProgress,
  revealThreshold = defaultRevealThreshold
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isScratchingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [isComplete, setIsComplete] = useState(false);

  const finishReveal = useCallback(() => {
    setIsComplete(true);
    onProgress?.(100);
    onComplete?.();
  }, [onComplete, onProgress]);

  const drawCover = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = Math.floor(rect.width * pixelRatio);
    canvas.height = Math.floor(rect.height * pixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.globalCompositeOperation = "source-over";

    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#f97316");
    gradient.addColorStop(0.52, "#7c3aed");
    gradient.addColorStop(1, "#111827");

    context.fillStyle = gradient;
    context.fillRect(0, 0, rect.width, rect.height);

    // Add light texture so the cover feels more like a scratch surface.
    context.fillStyle = "rgba(255, 255, 255, 0.16)";
    for (let i = 0; i < 110; i += 1) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      context.beginPath();
      context.arc(x, y, Math.random() * 1.8 + 0.6, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = "rgba(255, 255, 255, 0.92)";
    context.font = "800 20px system-ui, sans-serif";
    context.textAlign = "center";
    drawCenteredText(context, coverTitle, rect.width / 2, rect.height / 2 - 8, rect.width - 52, 25);
    context.font = "700 13px system-ui, sans-serif";
    context.fillStyle = "rgba(255, 255, 255, 0.72)";
    context.fillText(coverSubtitle, rect.width / 2, rect.height / 2 + 48);

    onProgress?.(0);
    setIsComplete(false);
  }, [coverSubtitle, coverTitle, onProgress]);

  useEffect(() => {
    drawCover();

    const container = containerRef.current;
    if (!container) return undefined;

    const resizeObserver = new ResizeObserver(drawCover);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [drawCover]);

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function scratchLine(fromPoint, toPoint) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();

    context.beginPath();
    context.arc(toPoint.x, toPoint.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  }

  function calculateScratchPercent() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    // The alpha channel is every fourth value. Alpha 0 means that pixel was erased.
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels += 1;
      }
    }

    return Math.round((transparentPixels / (pixels.length / 4)) * 100);
  }

  function handlePointerDown(event) {
    if (isComplete) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isScratchingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
    scratchLine(lastPointRef.current, lastPointRef.current);
  }

  function handlePointerMove(event) {
    if (!isScratchingRef.current || isComplete) return;

    const nextPoint = getCanvasPoint(event);
    scratchLine(lastPointRef.current, nextPoint);
    lastPointRef.current = nextPoint;

    const nextPercent = calculateScratchPercent();
    onProgress?.(nextPercent);

    if (nextPercent >= revealThreshold) {
      finishReveal();
    }
  }

  function handlePointerUp(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isScratchingRef.current = false;
    lastPointRef.current = null;
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {children}

      {!isComplete ? (
        <canvas
          ref={canvasRef}
          aria-label="Scratch away this cover to reveal the surprise"
          className="absolute inset-0 z-20 h-full w-full cursor-grab touch-none"
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="img"
        />
      ) : null}
    </div>
  );
}

function drawCenteredText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  lines.push(currentLine);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, x, startY + index * lineHeight);
  });
}
