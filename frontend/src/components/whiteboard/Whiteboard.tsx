/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file Whiteboard.tsx
 * @description The main whiteboard component using Fabric.js for the canvas.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Pencil, Eraser, Square, Circle, Type, Trash2, Download, Undo } from 'lucide-react';

// Define explicit type interface to ensure type safety
interface FabricCanvas {
  isDrawingMode: boolean;
  backgroundColor: string;
  width: number;
  height: number;
  freeDrawingBrush: {
    color: string;
    width: number;
  };
  dispose(): void;
  renderAll(): void;
  clear(): void;
  toDataURL(options?: { format?: string; quality?: number }): string;
}

interface WhiteboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const BRUSH_SIZES = [2, 4, 8, 12, 20];

const Whiteboard: React.FC<WhiteboardProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<'draw' | 'eraser'>('draw');

  useEffect(() => {
    if (isOpen && canvasRef.current && !fabricRef.current) {
      // Dynamic import fabric.js v7
      import('fabric').then((fabricModule) => {
        const { Canvas, PencilBrush } = fabricModule;
        if (canvasRef.current && Canvas) {
          const canvas = new Canvas(canvasRef.current, {
            isDrawingMode: true,
            backgroundColor: '#1f2937',
            width: Math.min(window.innerWidth * 0.7, 900),
            height: Math.min(window.innerHeight * 0.6, 500),
          });
          
          // Create and set up the pencil brush
          if (PencilBrush) {
            const brush = new PencilBrush(canvas);
            brush.color = '#ffffff';
            brush.width = 4;
            canvas.freeDrawingBrush = brush;
          } else if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = '#ffffff';
            canvas.freeDrawingBrush.width = 4;
          }
          
          fabricRef.current = canvas as unknown as FabricCanvas;
          canvas.renderAll();
        }
      }).catch((err) => {
        console.error('Failed to load fabric.js:', err);
      });
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (fabricRef.current?.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = tool === 'eraser' ? '#1f2937' : selectedColor;
      fabricRef.current.freeDrawingBrush.width = tool === 'eraser' ? 20 : brushSize;
    }
  }, [selectedColor, brushSize, tool]);

  const handleClear = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = '#1f2937';
      fabricRef.current.renderAll();
    }
  };

  const handleDownload = () => {
    if (fabricRef.current) {
      const dataURL = fabricRef.current.toDataURL({ format: 'png', quality: 1 });
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <h3 className="text-white font-medium">Whiteboard</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
              title="Clear"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-3 border-b border-gray-700 bg-gray-900/50">
          {/* Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTool('draw')}
              className={`p-2 rounded ${tool === 'draw' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              title="Draw"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded ${tool === 'eraser' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { setSelectedColor(color); setTool('draw'); }}
                className={`w-6 h-6 rounded-full border-2 ${selectedColor === color && tool === 'draw' ? 'border-cyan-400' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700" />

          {/* Brush sizes */}
          <div className="flex items-center gap-1">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-8 h-8 rounded flex items-center justify-center ${brushSize === size ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                title={`${size}px`}
              >
                <div
                  className="rounded-full bg-white"
                  style={{ width: Math.min(size, 16), height: Math.min(size, 16) }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="p-2">
          <canvas ref={canvasRef} className="rounded" />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
