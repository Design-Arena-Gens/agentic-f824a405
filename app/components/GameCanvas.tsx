'use client';

import { useEffect, useRef } from 'react';
import { GameState, Bot, Enemy } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  width: number;
  height: number;
}

export default function GameCanvas({ gameState, width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw player
    const player = gameState.player;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Player outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player health bar
    drawHealthBar(ctx, player.position.x, player.position.y - 20, player.health, player.maxHealth, '#00ffff');

    // Draw bots
    gameState.bots.forEach((bot) => {
      // Bot color based on state
      let color = '#00ff00';
      if (bot.state === 'attacking') color = '#ff6600';
      else if (bot.state === 'covering') color = '#ffff00';
      else if (bot.state === 'moving') color = '#00ff88';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bot.position.x, bot.position.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bot outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw state indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bot.state.toUpperCase(), bot.position.x, bot.position.y + 25);

      // Target line
      if (bot.target) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(bot.position.x, bot.position.y);
        ctx.lineTo(bot.target.position.x, bot.target.position.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Cover position indicator
      if (bot.coverPosition) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(bot.coverPosition.x, bot.coverPosition.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Health bar
      drawHealthBar(ctx, bot.position.x, bot.position.y - 18, bot.health, bot.maxHealth, color);
    });

    // Draw enemies
    gameState.enemies.forEach((enemy) => {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Enemy outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Health bar
      drawHealthBar(ctx, enemy.position.x, enemy.position.y - 18, enemy.health, enemy.maxHealth, '#ff0000');
    });

    // Draw legend
    drawLegend(ctx);

  }, [gameState, width, height]);

  const drawHealthBar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    health: number,
    maxHealth: number,
    color: string
  ) => {
    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = health / maxHealth;

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

    // Health
    ctx.fillStyle = color;
    ctx.fillRect(x - barWidth / 2, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const legendX = 10;
    const legendY = 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(legendX, legendY, 200, 140);

    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const items = [
      { color: '#00ffff', label: 'Player' },
      { color: '#00ff00', label: 'Bot (Idle/Following)' },
      { color: '#00ff88', label: 'Bot (Moving)' },
      { color: '#ff6600', label: 'Bot (Attacking)' },
      { color: '#ffff00', label: 'Bot (Taking Cover)' },
      { color: '#ff0000', label: 'Enemy' },
    ];

    items.forEach((item, index) => {
      const y = legendY + 20 + index * 20;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX + 15, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.label, legendX + 30, y + 4);
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border-2 border-cyan-500 rounded-lg shadow-2xl"
    />
  );
}
