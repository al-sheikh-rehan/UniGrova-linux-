import React, { useState } from 'react';
import { Calculator as CalcIcon, Delete, RotateCcw } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [mode, setMode] = useState<'standard' | 'programmer'>('standard');

  const handleDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const handleCalculate = () => {
    try {
      const fullExpr = equation + display;
      // Sanitize equation
      const sanitized = fullExpr.replace(/[^0-9+\-*/().]/g, '');
      // Evaluate safely
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  const numVal = parseInt(display, 10) || 0;
  const hexVal = numVal.toString(16).toUpperCase();
  const binVal = numVal.toString(2);
  const octVal = numVal.toString(8);

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-none overflow-hidden text-xs">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-1.5 font-medium">
          <CalcIcon className="w-3.5 h-3.5 text-orange-500" />
          <span>Calculator</span>
        </div>
        <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded border border-stone-800">
          <button
            onClick={() => setMode('standard')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              mode === 'standard' ? 'bg-orange-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode('programmer')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              mode === 'programmer' ? 'bg-orange-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Programmer
          </button>
        </div>
      </div>

      {/* Display Screen */}
      <div className="p-4 bg-stone-950 border-b border-stone-800 flex flex-col justify-end text-right font-mono">
        <div className="text-stone-500 text-xs min-h-[16px] truncate">{equation}</div>
        <div className="text-2xl font-bold text-stone-100 tracking-wider truncate mt-1">
          {display}
        </div>

        {/* Programmer Conversions */}
        {mode === 'programmer' && (
          <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-stone-800 text-[10px] text-left text-stone-400">
            <div>
              <span className="text-stone-500 font-semibold mr-1">HEX:</span>
              <span className="text-orange-400">{hexVal}</span>
            </div>
            <div>
              <span className="text-stone-500 font-semibold mr-1">DEC:</span>
              <span className="text-stone-200">{numVal}</span>
            </div>
            <div>
              <span className="text-stone-500 font-semibold mr-1">OCT:</span>
              <span className="text-stone-200">{octVal}</span>
            </div>
            <div className="truncate">
              <span className="text-stone-500 font-semibold mr-1">BIN:</span>
              <span className="text-emerald-400">{binVal}</span>
            </div>
          </div>
        )}
      </div>

      {/* Keypad Grid */}
      <div className="flex-1 grid grid-cols-4 gap-1 p-2 bg-stone-900">
        <button
          onClick={handleClear}
          className="p-3 rounded bg-stone-800 hover:bg-stone-700 text-red-400 font-semibold text-sm transition-colors"
        >
          C
        </button>
        <button
          onClick={handleBackspace}
          className="p-3 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-sm transition-colors flex items-center justify-center"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleOperator('/')}
          className="p-3 rounded bg-stone-800 hover:bg-stone-700 text-orange-400 font-semibold text-sm transition-colors"
        >
          ÷
        </button>
        <button
          onClick={() => handleOperator('*')}
          className="p-3 rounded bg-stone-800 hover:bg-stone-700 text-orange-400 font-semibold text-sm transition-colors"
        >
          ×
        </button>

        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="p-3 rounded bg-stone-800/60 hover:bg-stone-700 text-stone-100 font-semibold text-sm transition-colors"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('-')}
          className="p-3 rounded bg-stone-800 hover:bg-stone-700 text-orange-400 font-semibold text-sm transition-colors"
        >
          −
        </button>

        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="p-3 rounded bg-stone-800/60 hover:bg-stone-700 text-stone-100 font-semibold text-sm transition-colors"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('+')}
          className="p-3 rounded bg-stone-800 hover:bg-stone-700 text-orange-400 font-semibold text-sm transition-colors"
        >
          +
        </button>

        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="p-3 rounded bg-stone-800/60 hover:bg-stone-700 text-stone-100 font-semibold text-sm transition-colors"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleCalculate}
          className="row-span-2 p-3 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-base shadow transition-colors flex items-center justify-center"
        >
          =
        </button>

        <button
          onClick={() => handleDigit('0')}
          className="col-span-2 p-3 rounded bg-stone-800/60 hover:bg-stone-700 text-stone-100 font-semibold text-sm transition-colors"
        >
          0
        </button>
        <button
          onClick={() => !display.includes('.') && handleDigit('.')}
          className="p-3 rounded bg-stone-800/60 hover:bg-stone-700 text-stone-100 font-semibold text-sm transition-colors"
        >
          .
        </button>
      </div>
    </div>
  );
};
