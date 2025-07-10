'use client';

import { useRef, useEffect, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useSocket } from '@/providers/SocketProvider';

const ZOOM_SENSITIVITY = 0.001;
const GRID_CELL_SIZE = 32; // The size of one pixel cell in our world
const GRID_COLOR = '#CCCCCC';
const GRID_ZOOM_THRESHOLD = 5;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 30;

interface CanvasProps {
  initialOffset: { x: number; y: number };
  initialZoom: number;
}

const Canvas = ({ initialOffset, initialZoom }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedChunks, setLoadedChunks] = useState<Set<string>>(new Set());
  const { 
    offset, setOffset, 
    zoom, setZoom, 
    pixels, setPixel, removePixel,
    selectedColor 
  } = useCanvasStore();
  const { emitPixelChange, emitPixelRemove, emitRequestPixels } = useSocket();

  // Update URL on pan/zoom
  useEffect(() => {
    const debounce = setTimeout(() => {
      // Round the values to keep the URL clean
      const x = Math.round(offset.x);
      const y = Math.round(offset.y);
      const z = parseFloat(zoom.toFixed(2));
      window.history.replaceState(null, '', `/${x}/${y}/${z}`);
    }, 100); // Debounce to avoid excessive updates

    return () => clearTimeout(debounce);
  }, [offset, zoom]);

  // Request pixels when viewport changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleViewportChange = () => {
      const viewLeft = -offset.x / zoom;
      const viewTop = -offset.y / zoom;
      const viewRight = (canvas.width - offset.x) / zoom;
      const viewBottom = (canvas.height - offset.y) / zoom;

      const xMin = Math.floor(viewLeft / GRID_CELL_SIZE);
      const yMin = Math.floor(viewTop / GRID_CELL_SIZE);
      const xMax = Math.ceil(viewRight / GRID_CELL_SIZE);
      const yMax = Math.ceil(viewBottom / GRID_CELL_SIZE);

      const chunkX = Math.floor(xMin / 16); // Chunk size of 16x16 grid cells
      const chunkY = Math.floor(yMin / 16);
      const chunkKey = `${chunkX},${chunkY}`;

      if (!loadedChunks.has(chunkKey)) {
        emitRequestPixels({ xMin, yMin, xMax, yMax });
        setLoadedChunks(prev => new Set(prev).add(chunkKey));
      }
    };

    const debounce = setTimeout(handleViewportChange, 200);
    return () => clearTimeout(debounce);
  }, [offset, zoom, emitRequestPixels, loadedChunks]);

  // Set initial state only once
  useEffect(() => {
    setOffset(initialOffset);
    setZoom(initialZoom);
  }, []); // Empty dependency array ensures this runs only once on mount

  const [isPanning, setIsPanning] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState<{ x: number, y: number } | null>(null);

  const drawGrid = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.strokeStyle = GRID_COLOR;
    context.lineWidth = 1 / zoom; // Keep line width consistent when zooming

    // Calculate the visible bounds
    const viewLeft = -offset.x / zoom;
    const viewTop = -offset.y / zoom;
    const viewRight = (width - offset.x) / zoom;
    const viewBottom = (height - offset.y) / zoom;

    // Align to the grid
    const startX = Math.floor(viewLeft / GRID_CELL_SIZE) * GRID_CELL_SIZE;
    const startY = Math.floor(viewTop / GRID_CELL_SIZE) * GRID_CELL_SIZE;

    context.beginPath();
    for (let x = startX; x < viewRight; x += GRID_CELL_SIZE) {
      context.moveTo(x, viewTop);
      context.lineTo(x, viewBottom);
    }
    for (let y = startY; y < viewBottom; y += GRID_CELL_SIZE) {
      context.moveTo(viewLeft, y);
      context.lineTo(viewRight, y);
    }
    context.stroke();
  };

  const drawPixels = (context: CanvasRenderingContext2D) => {
    pixels.forEach(pixel => {
      context.fillStyle = pixel.color;
      context.fillRect(pixel.x * GRID_CELL_SIZE, pixel.y * GRID_CELL_SIZE, GRID_CELL_SIZE, GRID_CELL_SIZE);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Set a background color
    context.fillStyle = '#FDF6E3'; // A creamy background like the example
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    context.save();

    // Apply transformations
    context.translate(offset.x, offset.y);
    context.scale(zoom, zoom);

    drawPixels(context); // Draw all stored pixels

    // Draw grid if zoomed in enough
    if (zoom > GRID_ZOOM_THRESHOLD) {
      drawGrid(context, canvas.width, canvas.height);
    }

    // Draw preview pixel
    if (previewPosition && !isPanning) {
      context.globalAlpha = 0.5; // Make preview semi-transparent
      context.fillStyle = selectedColor === 'ERASER' ? '#FFFFFF' : selectedColor;
      if (selectedColor === 'ERASER') {
        context.strokeStyle = '#000000';
        context.lineWidth = 1 / zoom;
        context.strokeRect(
          previewPosition.x * GRID_CELL_SIZE, 
          previewPosition.y * GRID_CELL_SIZE, 
          GRID_CELL_SIZE, 
          GRID_CELL_SIZE
        );
      } else {
        context.fillRect(
          previewPosition.x * GRID_CELL_SIZE,
          previewPosition.y * GRID_CELL_SIZE,
          GRID_CELL_SIZE,
          GRID_CELL_SIZE
        );
      }
    }

    // Restore context state
    context.restore();

  }, [offset, zoom, pixels, isPanning, previewPosition, selectedColor]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Check for right-click to avoid panning on context menu
    if (event.button === 2) return;
    setHasDragged(false);
    setIsPanning(true);
    setLastPanPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasDragged) { // This was a click, not a drag
      const { clientX, clientY } = event;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const worldX = (clientX - offset.x) / zoom;
      const worldY = (clientY - offset.y) / zoom;

      const gridX = Math.floor(worldX / GRID_CELL_SIZE);
      const gridY = Math.floor(worldY / GRID_CELL_SIZE);
      
      if (selectedColor === 'ERASER') {
        removePixel(gridX, gridY); // Update local state
        emitPixelRemove(gridX, gridY); // Notify server
      } else {
        setPixel(gridX, gridY, selectedColor); // Update local state
        emitPixelChange(gridX, gridY, selectedColor); // Notify server
      }
    }
    
    // Reset states
    setIsPanning(false);
    setHasDragged(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setHasDragged(false);
    setPreviewPosition(null);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Update preview position regardless of panning
    const canvas = canvasRef.current;
    if (canvas) {
        const worldX = (event.clientX - offset.x) / zoom;
        const worldY = (event.clientY - offset.y) / zoom;
        const gridX = Math.floor(worldX / GRID_CELL_SIZE);
        const gridY = Math.floor(worldY / GRID_CELL_SIZE);
        setPreviewPosition({ x: gridX, y: gridY });
    }

    if (isPanning) {
      setHasDragged(true);
      const dx = event.clientX - lastPanPosition.x;
      const dy = event.clientY - lastPanPosition.y;

      setOffset({
        x: offset.x + dx,
        y: offset.y + dy,
      });

      setLastPanPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    const { clientX, clientY, deltaY } = event;
    const zoomFactor = 1 - deltaY * ZOOM_SENSITIVITY;
    
    // Calculate the new zoom level and clamp it
    const newZoomClamped = Math.max(MIN_ZOOM, Math.min(zoom * zoomFactor, MAX_ZOOM));

    // If zoom level is at its limit and we're trying to go further, do nothing
    if (newZoomClamped === zoom) {
      return;
    }

    // Get mouse position in world space before zoom
    const mouseX = (clientX - offset.x) / zoom;
    const mouseY = (clientY - offset.y) / zoom;
    
    // New offset to keep mouse position constant
    const newOffsetX = clientX - mouseX * newZoomClamped;
    const newOffsetY = clientY - mouseY * newZoomClamped;

    setZoom(newZoomClamped);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ cursor: isPanning && hasDragged ? 'grabbing' : 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave} // Stop panning if mouse leaves canvas
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right-click
    />
  );
};

export default Canvas; 