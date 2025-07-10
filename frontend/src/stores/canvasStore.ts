import { create } from 'zustand';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

// A predefined palette of colors
const PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#808000',
  '#008000', '#800080', '#008080', '#000080', '#C0C0C0', '#808080',
];

interface CanvasState {
  zoom: number;
  offset: { x: number; y: number };
  pixels: Pixel[];
  selectedColor: string;
  palette: string[];
  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  setSelectedColor: (color: string) => void;
  setPixel: (x: number, y: number, color: string) => void;
  removePixel: (x: number, y: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  zoom: 1,
  offset: { x: 0, y: 0 },
  pixels: [],
  selectedColor: PALETTE[0], // Default to the first color in the palette
  palette: PALETTE,
  setZoom: (zoom) => set({ zoom }),
  setOffset: (offset) => set({ offset }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setPixel: (x, y, color) => set((state) => {
    const newPixels = state.pixels.filter(p => p.x !== x || p.y !== y);
    return { pixels: [...newPixels, { x, y, color }] };
  }),
  removePixel: (x, y) => set((state) => ({
    pixels: state.pixels.filter(p => p.x !== x || p.y !== y),
  })),
})); 