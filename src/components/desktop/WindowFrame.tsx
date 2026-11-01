import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { WindowState } from '../../types';

interface WindowFrameProps {
  window: WindowState;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
  onUpdateSize: (size: { width: number; height: number }) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onUpdatePosition,
  onUpdateSize,
  children,
}) => {
  const isDragging = useRef<boolean>(false);
  const isResizing = useRef<boolean>(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });
  const resizeStart = useRef<{
    mouseX: number;
    mouseY: number;
    startW: number;
    startH: number;
  }>({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  // Handle Dragging
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    onFocus();
    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: win.position.x,
      startY: win.position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = moveEvent.clientX - dragStart.current.mouseX;
      const dy = moveEvent.clientY - dragStart.current.mouseY;
      const newX = Math.max(0, dragStart.current.startX + dx);
      const newY = Math.max(28, dragStart.current.startY + dy);
      onUpdatePosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (win.isMaximized) return;
    onFocus();
    isResizing.current = true;
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: win.size.width,
      startH: win.size.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const dw = moveEvent.clientX - resizeStart.current.mouseX;
      const dh = moveEvent.clientY - resizeStart.current.mouseY;
      const newW = Math.max(380, resizeStart.current.startW + dw);
      const newH = Math.max(260, resizeStart.current.startH + dh);
      onUpdateSize({ width: newW, height: newH });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!win.isOpen || win.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = win.isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: '1.75rem',
        width: '100vw',
        height: 'calc(100vh - 1.75rem)',
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      style={style}
      onMouseDown={onFocus}
      className={`flex flex-col bg-stone-900 border border-stone-700/80 shadow-2xl overflow-hidden transition-shadow ${
        win.isMaximized ? 'rounded-none' : 'rounded-lg'
      }`}
    >
      {/* Ubuntu Style Window Header */}
      <div
        onMouseDown={handleMouseDownHeader}
        onDoubleClick={onToggleMaximize}
        className="h-8 bg-stone-950 px-3 flex items-center justify-between select-none cursor-move border-b border-stone-800"
      >
        {/* Title */}
        <span className="font-medium text-stone-200 text-xs truncate max-w-xs sm:max-w-md">
          {win.title}
        </span>

        {/* Ubuntu Window Controls (Close, Maximize, Minimize on right) */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimize"
            className="w-4 h-4 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-stone-300 transition-colors"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize();
            }}
            title={win.isMaximized ? 'Restore' : 'Maximize'}
            className="w-4 h-4 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-stone-300 transition-colors"
          >
            {win.isMaximized ? <Copy className="w-2 h-2" /> : <Square className="w-2 h-2" />}
          </button>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
            className="w-4 h-4 rounded-full bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-2.5 h-2.5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 relative overflow-hidden">{children}</div>

      {/* Bottom Right Resize Grip */}
      {!win.isMaximized && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-center justify-center opacity-50 hover:opacity-100"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-stone-500" />
        </div>
      )}
    </div>
  );
};
