// Battle System Engine
import { getTypeAdvantage, getDamageModifier, createMonster, TYPES } from './monsterData';

/**
 * Calculate damage for a basic attack (simplified system)
 * Damage = (Attack * 2) - Defense + Type Modifier + Random Variance
 */
export function calculateDamage(attacker, defender) {
  // Base damage from attack stat
  let damage = Math.floor(attacker.baseStats.attack * 1.5);
  
  // Subtract defender's defense (but not too much)
  damage -= Math.floor(defender.baseStats.defense / 2);
  
  // Type advantage modifier
  const advantageModifier = getDamageModifier(attacker.type, defender.type);
  if (advantageModifier > 0) {
    damage += 3; // Super effective bonus
  } else if (advantageModifier < 0) {
    damage -= 2; // Not very effective penalty
  }
  
  // Random variance (±0-2)
  const variance = Math.floor(Math.random() * 3);
  damage += variance;
  
  // Minimum 1 damage
  damage = Math.max(1, damage);
  
  return damage;
}

/**
 * Check if attack hits or misses based on defender's defense
 */
export function checkHit(attacker, defender) {
  const advantage = getTypeAdvantage(attacker.type, defender.type);
  
  // Base hit chance: 85%
  let hitChance = 0.85;
  
  // Type advantage increases hit rate
  if (advantage === 'ADVANTAGE') {
    hitChance += 0.10; // 95%
  } else if (advantage === 'DISADVANTAGE') {
    hitChance -= 0.10; // 75%
  }
  
  // Defense affects dodge (higher defense = harder to hit)
  const defenseModifier = defender.baseStats.defense * 0.01;
  hitChance -= defenseModifier;
  
  // Roll the dice
  return Math.random() < hitChance;
}

/**
 * Apply poison damage
 */
export function applyPoisonDamage(monster) {
  if (monster.status === 'POISON') {
    const damage = 2; // Poison does 2 HP per turn
    const newHP = Math.max(0, monster.currentHP - damage);
    return {
      ...monster,
      currentHP: newHP
    };
  }
  return monster;
}

/**
 * Check if monster is knocked out
 */
export function isKnockedOut(monster) {
  return monster.currentHP <= 0;
}

/**
 * EXP thresholds for each level
 */
const LEVEL_THRESHOLDS = {
  2: 10,
  3: 35,
  4: 85,
  5: 185,
  6: 335,
  7: 535,
  8: 785,
  9: 1085,
  10: 1435
};

const MAX_LEVEL = 10;

/**
 * Check if monster should level up based on EXP
 */
export function checkLevelUp(monster) {
  let currentMonster = { ...monster };
  let leveledUp = false;
  let oldLevel = monster.level;

  // Keep leveling up while we have enough EXP
  while (currentMonster.level < MAX_LEVEL) {
    const nextLevel = currentMonster.level + 1;
    const expNeeded = LEVEL_THRESHOLDS[nextLevel];
    
    if (currentMonster.exp >= expNeeded) {
      // Level up!
      leveledUp = true;
      currentMonster = {
        ...currentMonster,
        level: nextLevel,
        maxHP: currentMonster.maxHP + 2,
        currentHP: currentMonster.currentHP + 2, // Heal the bonus HP
        baseStats: {
          ...currentMonster.baseStats,
          attack: currentMonster.baseStats.attack + 1,
          defense: currentMonster.baseStats.defense + 1,
          speed: currentMonster.baseStats.speed + 1
        }
      };
    } else {
      break;
    }
  }

  return {
    leveledUp,
    oldLevel,
    newLevel: currentMonster.level,
    monster: currentMonster
  };
}

/**
 * Get EXP needed for next level
 */
export function getExpToNextLevel(monster) {
  if (monster.level >= MAX_LEVEL) {
    return { current: monster.exp, needed: monster.exp, progress: 100 };
  }
  
  const currentThreshold = LEVEL_THRESHOLDS[monster.level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[monster.level + 1];
  const expIntoLevel = monster.exp - currentThreshold;
  const expNeededForLevel = nextThreshold - currentThreshold;
  const progress = Math.floor((expIntoLevel / expNeededForLevel) * 100);
  
  return {
    current: expIntoLevel,
    needed: expNeededForLevel,
    progress: Math.min(100, Math.max(0, progress))
  };
}

/**
 * Calculate EXP gained from a battle
 */
export function calculateBattleEXP(knockouts, won, typeDisadvantageKOs = 0) {
  let exp = 0;
  
  // EXP for each knockout
  exp += knockouts * 5;
  
  // Bonus for KOs against type disadvantage
  exp += typeDisadvantageKOs * 2;
  
  // Participation bonus
  if (won) {
    exp += 2; // Winners get +2
  } else {
    exp += 1; // Losers still get +1
  }
  
  return exp;
}

/**
 * Award post-battle rewards with new EXP system
 */
export function awardBattleRewards(team, didWin, knockoutTracker = {}) {
  return team.map(monster => {
    // Get knockouts for this monster (default 0)
    const kos = knockoutTracker[monster.id] || 0;
    const typeDisadvantageKOs = knockoutTracker[`${monster.id}_disadvantage`] || 0;
    
    // Calculate EXP gained
    const expGained = calculateBattleEXP(kos, didWin, typeDisadvantageKOs);
    
    // Update monster with new EXP
    const updated = {
      ...monster,
      exp: monster.exp + expGained
    };
    
    // Check for level up
    const levelUpResult = checkLevelUp(updated);
    
    return {
      monster: levelUpResult.monster,
      leveledUp: levelUpResult.leveledUp,
      oldLevel: levelUpResult.oldLevel,
      newLevel: levelUpResult.newLevel,
      expGained
    };
  });
}

/**
 * Simple AI for opponent - now considers type advantage for swapping
 */
export function getAIAction(monster, playerMonster, team = [], currentIndex = 0) {
  // Check if we're at a type disadvantage
  const advantage = getTypeAdvantage(monster.type, playerMonster.type);
  
  // If at disadvantage and we have teammates who might do better, consider swapping
  if (advantage === 'DISADVANTAGE' && team.length > 0) {
    // Find a teammate who has advantage or neutral against player
    const betterOption = team.findIndex((m, i) => {
      if (i === currentIndex || m.currentHP <= 0) return false;
      const theirAdvantage = getTypeAdvantage(m.type, playerMonster.type);
      return theirAdvantage === 'ADVANTAGE' || theirAdvantage === 'NEUTRAL';
    });
    
    // 50% chance to swap if we found a better option
    if (betterOption !== -1 && Math.random() < 0.5) {
      return {
        type: 'SWITCH',
        index: betterOption
      };
    }
  }

  // 90% attack, 10% do nothing/defend
  if (Math.random() < 0.9) {
    return { type: 'ATTACK' };
  } else {
    return { type: 'DEFEND' };
  }
}

/**
 * Determine turn order based on speed
 */
export function determineTurnOrder(playerMonster, enemyMonster) {
  if (playerMonster.baseStats.speed > enemyMonster.baseStats.speed) {
    return 'PLAYER_FIRST';
  } else if (playerMonster.baseStats.speed < enemyMonster.baseStats.speed) {
    return 'ENEMY_FIRST';
  } else {
    // Tie - random
    return Math.random() < 0.5 ? 'PLAYER_FIRST' : 'ENEMY_FIRST';
  }
}

/**
 * Generate random enemy team
 * NOW WITH VARIATION - sometimes easier, sometimes harder!
 */
export function generateEnemyTeam(playerTeam, playerLevel = 1) {
  // Calculate average level and total power of player's team
  const avgLevel = playerTeam.length > 0 
    ? Math.round(playerTeam.reduce((sum, m) => sum + m.level, 0) / playerTeam.length)
    : 1;
  
  const avgRarity = playerTeam.length > 0
    ? playerTeam.reduce((sum, m) => sum + (m.id % 42), 0) / playerTeam.length
    : 21;

  // VARIATION: Roll for difficulty (-2 to +2)
  // -2 = much easier, -1 = easier, 0 = fair, +1 = harder, +2 = much harder
  const difficultyRoll = Math.floor(Math.random() * 5) - 2;
  
  // Generate 3 random enemy monsters
  const enemies = [];
  const usedIds = new Set();

  for (let i = 0; i < 3; i++) {
    // Pick a random monster ID (1-126)
    // Bias the ID based on difficulty and player's average rarity
    let monsterId;
    let attempts = 0;
    do {
      // Base random ID
      let baseId = Math.floor(Math.random() * 126) + 1;
      
      // Shift based on difficulty (higher ID = rarer = stronger)
      const shift = difficultyRoll * 10;
      baseId = Math.max(1, Math.min(126, baseId + shift));
      
      monsterId = baseId;
      attempts++;
    } while (usedIds.has(monsterId) && attempts < 20);
    usedIds.add(monsterId);

    // Create the monster with a fake barcode
    const monster = createMonster(monsterId, `ENEMY_${monsterId}`);

    // Calculate level with variation
    // Base: match player level, then adjust by difficulty
    let enemyLevel = Math.max(1, Math.min(10, avgLevel + difficultyRoll));
    
    // Random additional variance of ±1 per monster
    const individualVariance = Math.floor(Math.random() * 3) - 1;
    enemyLevel = Math.max(1, Math.min(10, enemyLevel + individualVariance));

    // Calculate stat bonuses based on level difference from base monster
    const levelBonus = Math.max(0, enemyLevel - 1);
    
    // Extra variance in HP (±5)
    const hpVariance = Math.floor(Math.random() * 11) - 5;
    
    enemies.push({
      ...monster,
      id: `enemy_${monsterId}_${i}`,
      visualId: monsterId,
      level: enemyLevel,
      maxHP: Math.max(10, monster.maxHP + (levelBonus * 3) + hpVariance),
      currentHP: Math.max(10, monster.maxHP + (levelBonus * 3) + hpVariance),
      baseStats: {
        ...monster.baseStats,
        attack: Math.max(1, monster.baseStats.attack + levelBonus + Math.floor(difficultyRoll / 2)),
        defense: Math.max(1, monster.baseStats.defense + levelBonus + Math.floor(difficultyRoll / 2)),
        speed: Math.max(1, monster.baseStats.speed + levelBonus)
      },
      isEnemy: true
    });
  }

  return enemies;
}