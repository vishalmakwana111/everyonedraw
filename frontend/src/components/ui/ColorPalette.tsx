'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { FaEraser } from 'react-icons/fa';

const ColorPalette = () => {
  const { palette, selectedColor, setSelectedColor } = useCanvasStore();

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-neutral-800/50 backdrop-blur-sm p-2 rounded-xl shadow-lg flex flex-col gap-2 border border-neutral-700/50">
      {palette.map((color) => (
        <button
          key={color}
          onClick={() => setSelectedColor(color)}
          aria-label={`Color ${color}`}
          className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-150 border-2 ${
            selectedColor === color
              ? 'scale-110 border-sky-400'
              : 'border-transparent hover:scale-110 hover:border-sky-500/50'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <div className="border-t border-neutral-700 my-1" />
      <button
        onClick={() => setSelectedColor('ERASER')}
        aria-label="Eraser"
        className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all duration-150 border-2 ${
          selectedColor === 'ERASER'
            ? 'scale-110 border-sky-400 bg-neutral-600'
            : 'border-transparent bg-neutral-700 hover:scale-110 hover:border-sky-500/50'
        }`}
      >
        <FaEraser className="text-neutral-200" />
      </button>
    </div>
  );
};

export default ColorPalette; 