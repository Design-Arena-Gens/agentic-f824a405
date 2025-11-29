'use client';

import { ModSettings, MovementSpeed } from '../types';

interface ModOptionsProps {
  settings: ModSettings;
  onChange: (settings: ModSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModOptions({ settings, onChange, isOpen, onClose }: ModOptionsProps) {
  if (!isOpen) return null;

  const handleDamageChange = (value: number) => {
    onChange({ ...settings, damageMultiplier: value });
  };

  const handleSpeedChange = (speed: MovementSpeed) => {
    onChange({ ...settings, movementSpeed: speed });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-cyan-500 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-cyan-400">SmartTeammates Mod Options</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-8">
          {/* Damage Multiplier */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <label className="block text-xl font-semibold mb-4 text-cyan-300">
              Bot Damage Multiplier
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={settings.damageMultiplier}
                onChange={(e) => handleDamageChange(parseFloat(e.target.value))}
                className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-2xl font-bold text-white min-w-[60px] text-center">
                {settings.damageMultiplier.toFixed(1)}x
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>1.0x (Default)</span>
              <span>5.0x (Maximum)</span>
            </div>
            <p className="text-gray-400 mt-3 text-sm">
              Increases the damage output of all bot attacks by the selected multiplier.
            </p>
          </div>

          {/* Movement Speed */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <label className="block text-xl font-semibold mb-4 text-cyan-300">
              Bot Movement Speed
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleSpeedChange('standard')}
                className={`py-4 px-6 rounded-lg font-semibold transition-all ${
                  settings.movementSpeed === 'standard'
                    ? 'bg-cyan-600 text-white border-2 border-cyan-400 shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                Standard
                <div className="text-xs mt-1 opacity-75">1.0x speed</div>
              </button>
              <button
                onClick={() => handleSpeedChange('fast')}
                className={`py-4 px-6 rounded-lg font-semibold transition-all ${
                  settings.movementSpeed === 'fast'
                    ? 'bg-cyan-600 text-white border-2 border-cyan-400 shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                Fast
                <div className="text-xs mt-1 opacity-75">1.5x speed</div>
              </button>
              <button
                onClick={() => handleSpeedChange('veryFast')}
                className={`py-4 px-6 rounded-lg font-semibold transition-all ${
                  settings.movementSpeed === 'veryFast'
                    ? 'bg-cyan-600 text-white border-2 border-cyan-400 shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                Very Fast
                <div className="text-xs mt-1 opacity-75">2.5x speed</div>
              </button>
            </div>
            <p className="text-gray-400 mt-3 text-sm">
              Controls how quickly bots navigate the environment and respond to threats.
            </p>
          </div>

          {/* Info Section */}
          <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-500">
            <h3 className="font-semibold text-blue-300 mb-2">🤖 AI Features Active:</h3>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Intelligent target prioritization (threats to player first)</li>
              <li>Strategic cover usage when health is low</li>
              <li>Tactical ability usage with cooldown management</li>
              <li>Dynamic pathfinding and obstacle navigation</li>
              <li>Automatic player following when out of range</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            <span className="text-cyan-400 font-semibold">SmartTeammates</span> by Skyline
          </div>
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
