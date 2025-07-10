'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { FaEraser } from 'react-icons/fa';

const ColorPalette = () => {
  const { palette, selectedColor, setSelectedColor } = useCanvasStore();

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-200 p-2 rounded-lg shadow-lg flex flex-col gap-2">
      {palette.map((color) => (
        <div
          key={color}
          onClick={() => setSelectedColor(color)}
          className={`w-8 h-8 rounded-full cursor-pointer transition-transform duration-150 ${
            selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'ring-1 ring-gray-400'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <div className="border-t border-gray-400 my-2" />
      <div
        onClick={() => setSelectedColor('ERASER')}
        className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-transform duration-150 ${
          selectedColor === 'ERASER' ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 bg-gray-400' : 'ring-1 ring-gray-400 bg-gray-300'
        }`}
      >
        <FaEraser className="text-gray-800" />
      </div>
    </div>
  );
};

export default ColorPalette; 