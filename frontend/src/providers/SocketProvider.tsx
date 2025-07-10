'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { socket } from '@/lib/socket';
import { useCanvasStore, Pixel } from '@/stores/canvasStore';

interface SocketContextType {
  emitPixelChange: (x: number, y: number, color: string) => void;
  emitPixelRemove: (x: number, y: number) => void;
  emitRequestPixels: (bounds: { xMin: number, yMin: number, xMax: number, yMax: number }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { setPixel, removePixel, addPixels } = useCanvasStore();

  useEffect(() => {
    socket.connect();

    const onConnect = () => console.log('Socket connected');
    const onDisconnect = () => console.log('Socket disconnected');
    
    const onPixelsLoaded = (newPixels: Pixel[]) => {
      addPixels(newPixels);
    };

    const onPixelUpdated = (data: { x: number, y: number, color: string }) => {
        setPixel(data.x, data.y, data.color);
    };

    const onPixelRemoved = (data: { x: number, y: number }) => {
        removePixel(data.x, data.y);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pixels_loaded', onPixelsLoaded);
    socket.on('pixel_updated', onPixelUpdated);
    socket.on('pixel_removed', onPixelRemoved);


    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pixels_loaded', onPixelsLoaded);
      socket.off('pixel_updated', onPixelUpdated);
      socket.off('pixel_removed', onPixelRemoved);
      socket.disconnect();
    };
  }, [setPixel, removePixel, addPixels]);

  const emitPixelChange = (x: number, y: number, color: string) => {
    socket.emit('pixel_change', { x, y, color });
  };
  
  const emitPixelRemove = (x: number, y: number) => {
    socket.emit('pixel_remove', { x, y });
  };

  const emitRequestPixels = (bounds: { xMin: number, yMin: number, xMax: number, yMax: number }) => {
    socket.emit('request_pixels', bounds);
  };

  return (
    <SocketContext.Provider value={{ emitPixelChange, emitPixelRemove, emitRequestPixels }}>
      {children}
    </SocketContext.Provider>
  );
}; 