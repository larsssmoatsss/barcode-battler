// Item Data System
// 8 items total, mapped from barcode product codes

export const ITEM_DATA = {
  1: {
    id: 1,
    name: "Potion",
    description: "Heals 10 HP",
    effect: "HEAL",
    value: 10,
    usableInBattle: true,
    usableOutside: true
  },
  2: {
    id: 2,
    name: "Super Potion",
    description: "Heals 25 HP",
    effect: "HEAL",
    value: 25,
    usableInBattle: true,
    usableOutside: true
  },
  3: {
    id: 3,
    name: "Max Potion",
    description: "Fully restores HP",
    effect: "HEAL_FULL",
    value: 999,
    usableInBattle: true,
    usableOutside: true
  },
  4: {
    id: 4,
    name: "Revive",
    description: "Revives a fainted monster with 50% HP",
    effect: "REVIVE",
    value: 0.5,
    usableInBattle: true,
    usableOutside: true
  },
  5: {
    id: 5,
    name: "Attack Boost",
    description: "+3 Attack for this battle",
    effect: "BUFF_ATTACK",
    value: 3,
    usableInBattle: true,
    usableOutside: false
  },
  6: {
    id: 6,
    name: "Defense Boost",
    description: "+3 Defense for this battle",
    effect: "BUFF_DEFENSE",
    value: 3,
    usableInBattle: true,
    usableOutside: false
  },
  7: {
    id: 7,
    name: "Speed Boost",
    description: "+3 Speed for this battle",
    effect: "BUFF_SPEED",
    value: 3,
    usableInBattle: true,
    usableOutside: false
  },
  8: {
    id: 8,
    name: "Full Restore",
    description: "Fully restores HP and cures status",
    effect: "FULL_RESTORE",
    value: 999,
    usableInBattle: true,
    usableOutside: true
  }
};

// Map barcode ID (1-24) to item ID (1-8)
// Each item can come from 3 different barcode values
export function mapBarcodeToItem(barcodeItemId) {
  // barcodeItemId is 1-24, map to item 1-8
  // Items 1-8 each get 3 barcode values
  const itemId = Math.ceil(barcodeItemId / 3);
  return Math.min(itemId, 8);
}

/**
 * Create an item instance from barcode item ID
 */
export function createItem(barcodeItemId, barcodeString) {
  const itemId = mapBarcodeToItem(barcodeItemId);
  const data = ITEM_DATA[itemId];
  
  if (!data) {
    return null;
  }

  return {
    ...data,
    obtainedFrom: barcodeString,
    obtainedAt: Date.now()
  };
}

/**
 * Apply item effect to a monster
 * Returns { success, monster, message }
 */
export function useItem(item, monster, isInBattle = false) {
  // Check if item can be used in current context
  if (isInBattle && !item.usableInBattle) {
    return { success: false, monster, message: "Can't use this item in battle!" };
  }
  if (!isInBattle && !item.usableOutside) {
    return { success: false, monster, message: "Can only use this in battle!" };
  }

  let updatedMonster = { ...monster };
  let message = "";

  switch (item.effect) {
    case "HEAL":
      if (monster.currentHP <= 0) {
        return { success: false, monster, message: `${monster.name} is fainted!` };
      }
      if (monster.currentHP >= monster.maxHP) {
        return { success: false, monster, message: `${monster.name} is already at full HP!` };
      }
      const healAmount = Math.min(item.value, monster.maxHP - monster.currentHP);
      updatedMonster.currentHP = monster.currentHP + healAmount;
      message = `${monster.name} recovered ${healAmount} HP!`;
      break;

    case "HEAL_FULL":
      if (monster.currentHP <= 0) {
        return { success: false, monster, message: `${monster.name} is fainted!` };
      }
      if (monster.currentHP >= monster.maxHP) {
        return { success: false, monster, message: `${monster.name} is already at full HP!` };
      }
      updatedMonster.currentHP = monster.maxHP;
      message = `${monster.name} fully recovered!`;
      break;

    case "REVIVE":
      if (monster.currentHP > 0) {
        return { success: false, monster, message: `${monster.name} isn't fainted!` };
      }
      updatedMonster.currentHP = Math.floor(monster.maxHP * item.value);
      message = `${monster.name} was revived!`;
      break;

    case "BUFF_ATTACK":
      if (monster.currentHP <= 0) {
        return { success: false, monster, message: `${monster.name} is fainted!` };
      }
      updatedMonster.baseStats = {
        ...monster.baseStats,
        attack: monster.baseStats.attack + item.value
      };
      updatedMonster.attackBuffed = true;
      message = `${monster.name}'s Attack rose!`;
      break;

    case "BUFF_DEFENSE":
      if (monster.currentHP <= 0) {
        return { success: false, monster, message: `${monster.name} is fainted!` };
      }
      updatedMonster.baseStats = {
        ...monster.baseStats,
        defense: monster.baseStats.defense + item.value
      };
      updatedMonster.defenseBuffed = true;
      message = `${monster.name}'s Defense rose!`;
      break;

    case "BUFF_SPEED":
      if (monster.currentHP <= 0) {
        return { success: false, monster, message: `${monster.name} is fainted!` };
      }
      updatedMonster.baseStats = {
        ...monster.baseStats,
        speed: monster.baseStats.speed + item.value
      };
      updatedMonster.speedBuffed = true;
      message = `${monster.name}'s Speed rose!`;
      break;

    case "FULL_RESTORE":
      if (monster.currentHP <= 0) {
        return { success: false, monster, message: `${monster.name} is fainted! Use a Revive first.` };
      }
      updatedMonster.currentHP = monster.maxHP;
      updatedMonster.status = null;
      message = `${monster.name} fully recovered!`;
      break;

    default:
      return { success: false, monster, message: "Unknown item effect!" };
  }

  return { success: true, monster: updatedMonster, message };
}

/**
 * Get item rarity based on ID (for UI coloring)
 */
export function getItemRarity(itemId) {
  if (itemId <= 2) return 'COMMON';      // Potion, Super Potion
  if (itemId <= 4) return 'UNCOMMON';    // Max Potion, Revive
  if (itemId <= 7) return 'RARE';        // Stat boosts
  return 'EPIC';                          // Full Restore
}

/**
 * Get item color based on effect type
 */
export function getItemColor(item) {
  switch (item.effect) {
    case 'HEAL':
    case 'HEAL_FULL':
    case 'FULL_RESTORE':
      return '#22C55E'; // Green for healing
    case 'REVIVE':
      return '#EAB308'; // Gold for revive
    case 'BUFF_ATTACK':
      return '#EF4444'; // Red for attack
    case 'BUFF_DEFENSE':
      return '#3B82F6'; // Blue for defense
    case 'BUFF_SPEED':
      return '#A855F7'; // Purple for speed
    default:
      return '#9CA3AF'; // Gray
  }
}