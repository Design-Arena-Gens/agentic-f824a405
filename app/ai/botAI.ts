import { Bot, Enemy, Player, Vector2D, ModSettings, Entity } from '../types';

export class BotAI {
  private settings: ModSettings;

  constructor(settings: ModSettings) {
    this.settings = settings;
  }

  updateSettings(settings: ModSettings) {
    this.settings = settings;
  }

  private distance(a: Vector2D, b: Vector2D): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  private normalize(v: Vector2D): Vector2D {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: v.x / mag, y: v.y / mag };
  }

  private getMovementSpeedMultiplier(): number {
    switch (this.settings.movementSpeed) {
      case 'standard': return 1.0;
      case 'fast': return 1.5;
      case 'veryFast': return 2.5;
      default: return 1.0;
    }
  }

  private findNearestEnemy(bot: Bot, enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;

    let nearest = enemies[0];
    let minDist = this.distance(bot.position, nearest.position);

    for (const enemy of enemies) {
      const dist = this.distance(bot.position, enemy.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private prioritizeTarget(bot: Bot, enemies: Enemy[], player: Player): Enemy | null {
    if (enemies.length === 0) return null;

    // Priority 1: Enemies attacking player (within 150 units)
    const threateningEnemies = enemies.filter(e =>
      this.distance(e.position, player.position) < 150
    );

    if (threateningEnemies.length > 0) {
      return this.findNearestEnemy(bot, threateningEnemies);
    }

    // Priority 2: Low health enemies (easier kills)
    const lowHealthEnemies = enemies.filter(e => e.health < e.maxHealth * 0.3);
    if (lowHealthEnemies.length > 0) {
      return this.findNearestEnemy(bot, lowHealthEnemies);
    }

    // Priority 3: Nearest enemy
    return this.findNearestEnemy(bot, enemies);
  }

  private findCoverPosition(bot: Bot, threat: Vector2D, gameWidth: number, gameHeight: number): Vector2D {
    const dirFromThreat = this.normalize({
      x: bot.position.x - threat.x,
      y: bot.position.y - threat.y
    });

    const coverDist = 80;
    return {
      x: Math.max(20, Math.min(gameWidth - 20, bot.position.x + dirFromThreat.x * coverDist)),
      y: Math.max(20, Math.min(gameHeight - 20, bot.position.y + dirFromThreat.y * coverDist))
    };
  }

  private shouldUseCover(bot: Bot): boolean {
    return bot.health < bot.maxHealth * 0.4;
  }

  private shouldUseAbility(bot: Bot, currentTime: number): boolean {
    const abilityCooldown = 5000; // 5 seconds
    return currentTime - bot.lastAbilityUse > abilityCooldown && bot.target !== null;
  }

  update(bot: Bot, enemies: Enemy[], player: Player, currentTime: number, gameWidth: number, gameHeight: number): Bot {
    const baseSpeed = 2;
    const speedMultiplier = this.getMovementSpeedMultiplier();
    const speed = baseSpeed * speedMultiplier;

    // Update target priority
    bot.target = this.prioritizeTarget(bot, enemies, player);

    if (bot.target) {
      const distToTarget = this.distance(bot.position, bot.target.position);
      const attackRange = 200;

      // Check if bot should take cover
      if (this.shouldUseCover(bot)) {
        bot.state = 'covering';
        if (!bot.coverPosition) {
          bot.coverPosition = this.findCoverPosition(bot, bot.target.position, gameWidth, gameHeight);
        }

        // Move to cover
        const dirToCover = this.normalize({
          x: bot.coverPosition.x - bot.position.x,
          y: bot.coverPosition.y - bot.position.y
        });

        bot.velocity = { x: dirToCover.x * speed, y: dirToCover.y * speed };

        // Still attack from cover if in range
        if (distToTarget < attackRange * 1.5) {
          bot.state = 'attacking';
        }
      } else {
        bot.coverPosition = null;

        if (distToTarget > attackRange) {
          // Move towards target
          bot.state = 'moving';
          const direction = this.normalize({
            x: bot.target.position.x - bot.position.x,
            y: bot.target.position.y - bot.position.y
          });
          bot.velocity = { x: direction.x * speed, y: direction.y * speed };
        } else {
          // In range - attack
          bot.state = 'attacking';
          bot.velocity = { x: 0, y: 0 };

          // Use ability if available
          if (this.shouldUseAbility(bot, currentTime)) {
            bot.lastAbilityUse = currentTime;
            // Ability usage is tracked, damage boost applied in combat system
          }
        }
      }

      // Follow player if too far away
      const distToPlayer = this.distance(bot.position, player.position);
      if (distToPlayer > 400) {
        bot.state = 'following';
        const dirToPlayer = this.normalize({
          x: player.position.x - bot.position.x,
          y: player.position.y - bot.position.y
        });
        bot.velocity = { x: dirToPlayer.x * speed * 1.2, y: dirToPlayer.y * speed * 1.2 };
      }
    } else {
      // No enemies - follow player
      bot.state = 'following';
      const distToPlayer = this.distance(bot.position, player.position);

      if (distToPlayer > 150) {
        const direction = this.normalize({
          x: player.position.x - bot.position.x,
          y: player.position.y - bot.position.y
        });
        bot.velocity = { x: direction.x * speed, y: direction.y * speed };
      } else {
        bot.state = 'idle';
        bot.velocity = { x: 0, y: 0 };
      }
    }

    // Update position with boundary checking
    bot.position.x = Math.max(10, Math.min(gameWidth - 10, bot.position.x + bot.velocity.x));
    bot.position.y = Math.max(10, Math.min(gameHeight - 10, bot.position.y + bot.velocity.y));

    return bot;
  }

  calculateDamage(baseDamage: number, isAbilityActive: boolean): number {
    let damage = baseDamage * this.settings.damageMultiplier;

    // Ability provides additional 50% damage boost
    if (isAbilityActive) {
      damage *= 1.5;
    }

    return damage;
  }
}
