'use client';

import { useState, useEffect, useCallback } from 'react';
import ModOptions from './components/ModOptions';
import GameCanvas from './components/GameCanvas';
import { ModSettings, GameState, Bot, Enemy, Player } from './types';
import { BotAI } from './ai/botAI';

export default function Home() {
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;

  const [settings, setSettings] = useState<ModSettings>({
    damageMultiplier: 1.0,
    movementSpeed: 'standard'
  });

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [botAI] = useState(() => new BotAI(settings));
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({
    enemiesKilled: 0,
    damageDealt: 0,
    waveNumber: 1
  });

  function initializeGame(): GameState {
    const player: Player = {
      id: 'player',
      position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      health: 100,
      maxHealth: 100,
      team: 'player',
      type: 'player'
    };

    const bots: Bot[] = [
      {
        id: 'bot1',
        position: { x: GAME_WIDTH / 2 - 50, y: GAME_HEIGHT / 2 + 50 },
        health: 80,
        maxHealth: 80,
        team: 'player',
        type: 'bot',
        target: null,
        state: 'idle',
        velocity: { x: 0, y: 0 },
        lastAbilityUse: 0,
        coverPosition: null
      },
      {
        id: 'bot2',
        position: { x: GAME_WIDTH / 2 + 50, y: GAME_HEIGHT / 2 + 50 },
        health: 80,
        maxHealth: 80,
        team: 'player',
        type: 'bot',
        target: null,
        state: 'idle',
        velocity: { x: 0, y: 0 },
        lastAbilityUse: 0,
        coverPosition: null
      },
      {
        id: 'bot3',
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 80 },
        health: 80,
        maxHealth: 80,
        team: 'player',
        type: 'bot',
        target: null,
        state: 'idle',
        velocity: { x: 0, y: 0 },
        lastAbilityUse: 0,
        coverPosition: null
      }
    ];

    return {
      player,
      bots,
      enemies: [],
      time: 0
    };
  }

  const spawnEnemyWave = useCallback((waveNum: number) => {
    const enemyCount = Math.min(3 + waveNum * 2, 15);
    const newEnemies: Enemy[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;

      switch (side) {
        case 0: // Top
          x = Math.random() * GAME_WIDTH;
          y = 20;
          break;
        case 1: // Right
          x = GAME_WIDTH - 20;
          y = Math.random() * GAME_HEIGHT;
          break;
        case 2: // Bottom
          x = Math.random() * GAME_WIDTH;
          y = GAME_HEIGHT - 20;
          break;
        default: // Left
          x = 20;
          y = Math.random() * GAME_HEIGHT;
      }

      newEnemies.push({
        id: `enemy_${Date.now()}_${i}`,
        position: { x, y },
        health: 50 + waveNum * 10,
        maxHealth: 50 + waveNum * 10,
        team: 'enemy',
        type: 'enemy',
        velocity: { x: 0, y: 0 }
      });
    }

    return newEnemies;
  }, []);

  useEffect(() => {
    botAI.updateSettings(settings);
  }, [settings, botAI]);

  useEffect(() => {
    if (isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.time += 16;

        // Spawn enemies if none exist
        if (newState.enemies.length === 0) {
          newState.enemies = spawnEnemyWave(stats.waveNumber);
          setStats(prev => ({ ...prev, waveNumber: prev.waveNumber + 1 }));
        }

        // Update bots with AI
        newState.bots = newState.bots.map(bot =>
          botAI.update(bot, newState.enemies, newState.player, newState.time, GAME_WIDTH, GAME_HEIGHT)
        );

        // Update enemies (simple movement towards player)
        newState.enemies = newState.enemies.map(enemy => {
          const dx = newState.player.position.x - enemy.position.x;
          const dy = newState.player.position.y - enemy.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            enemy.velocity = {
              x: (dx / dist) * 1.2,
              y: (dy / dist) * 1.2
            };

            enemy.position.x += enemy.velocity.x;
            enemy.position.y += enemy.velocity.y;
          }

          return enemy;
        });

        // Combat logic - bots attack enemies
        newState.bots.forEach(bot => {
          if (bot.state === 'attacking' && bot.target) {
            const target = newState.enemies.find(e => e.id === bot.target?.id);
            if (target) {
              const baseDamage = 0.3;
              const isAbilityActive = newState.time - bot.lastAbilityUse < 2000;
              const damage = botAI.calculateDamage(baseDamage, isAbilityActive);
              target.health -= damage;

              setStats(prev => ({ ...prev, damageDealt: prev.damageDealt + damage }));

              if (target.health <= 0) {
                setStats(prev => ({ ...prev, enemiesKilled: prev.enemiesKilled + 1 }));
              }
            }
          }
        });

        // Remove dead enemies
        newState.enemies = newState.enemies.filter(e => e.health > 0);

        // Enemies attack player and bots
        newState.enemies.forEach(enemy => {
          // Attack player
          const distToPlayer = Math.sqrt(
            Math.pow(enemy.position.x - newState.player.position.x, 2) +
            Math.pow(enemy.position.y - newState.player.position.y, 2)
          );
          if (distToPlayer < 30) {
            newState.player.health -= 0.1;
          }

          // Attack bots
          newState.bots.forEach(bot => {
            const distToBot = Math.sqrt(
              Math.pow(enemy.position.x - bot.position.x, 2) +
              Math.pow(enemy.position.y - bot.position.y, 2)
            );
            if (distToBot < 30) {
              bot.health -= 0.08;
            }
          });
        });

        // Heal bots slowly when not in combat
        newState.bots = newState.bots.map(bot => {
          if (bot.state !== 'attacking' && bot.state !== 'covering') {
            bot.health = Math.min(bot.maxHealth, bot.health + 0.05);
          }
          return bot;
        });

        return newState;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [botAI, isPaused, spawnEnemyWave, stats.waveNumber]);

  const handleReset = () => {
    setGameState(initializeGame());
    setStats({ enemiesKilled: 0, damageDealt: 0, waveNumber: 1 });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-cyan-400 mb-2">SmartTeammates</h1>
          <p className="text-gray-300 text-lg">Advanced AI Teammate Bot Mod</p>
          <p className="text-gray-500 text-sm">by Skyline</p>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas */}
          <div className="flex-1">
            <GameCanvas gameState={gameState} width={GAME_WIDTH} height={GAME_HEIGHT} />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-cyan-500">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsOptionsOpen(true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                  ⚙️ Mod Options
                </button>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                  🔄 Reset Game
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-cyan-500">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Wave:</span>
                  <span className="text-white font-bold">{stats.waveNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Enemies Killed:</span>
                  <span className="text-white font-bold">{stats.enemiesKilled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Damage Dealt:</span>
                  <span className="text-white font-bold">{Math.floor(stats.damageDealt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Player Health:</span>
                  <span className="text-white font-bold">{Math.max(0, Math.floor(gameState.player.health))}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Bots:</span>
                  <span className="text-white font-bold">{gameState.bots.filter(b => b.health > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Enemies:</span>
                  <span className="text-white font-bold">{gameState.enemies.length}</span>
                </div>
              </div>
            </div>

            {/* Current Settings */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-cyan-500">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Active Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Damage:</span>
                  <span className="text-cyan-300 font-bold">{settings.damageMultiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed:</span>
                  <span className="text-cyan-300 font-bold capitalize">
                    {settings.movementSpeed === 'veryFast' ? 'Very Fast' : settings.movementSpeed}
                  </span>
                </div>
              </div>
            </div>

            {/* Bot States */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-cyan-500">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Bot Status</h3>
              <div className="space-y-2 text-xs">
                {gameState.bots.map((bot, index) => (
                  <div key={bot.id} className="flex justify-between items-center">
                    <span className="text-gray-400">Bot {index + 1}:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        bot.state === 'attacking' ? 'text-orange-400' :
                        bot.state === 'covering' ? 'text-yellow-400' :
                        bot.state === 'moving' ? 'text-green-400' :
                        'text-gray-300'
                      }`}>
                        {bot.state.toUpperCase()}
                      </span>
                      <span className="text-white">
                        {Math.max(0, Math.floor(bot.health))}/{bot.maxHealth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border-2 border-cyan-500">
          <h3 className="text-xl font-bold text-cyan-400 mb-3">🤖 AI Features</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Intelligent Navigation:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Dynamic pathfinding to targets</li>
                <li>Boundary awareness & collision avoidance</li>
                <li>Automatic player following when distant</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Target Prioritization:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Threats to player prioritized first</li>
                <li>Low-health enemies for quick eliminations</li>
                <li>Nearest enemy fallback strategy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Strategic Combat:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Cover usage when health drops below 40%</li>
                <li>Ability usage with 5s cooldown</li>
                <li>Abilities provide 50% damage boost</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Customization:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Damage multiplier: 1x to 5x</li>
                <li>Speed settings: Standard/Fast/Very Fast</li>
                <li>Real-time setting updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ModOptions
        settings={settings}
        onChange={setSettings}
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
      />
    </main>
  );
}
