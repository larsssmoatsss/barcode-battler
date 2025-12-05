// LocalStorage management for game data

const STORAGE_KEYS = {
  MONSTERS: 'barcode_battler_monsters',
  ITEMS: 'barcode_battler_items',
  STATS: 'barcode_battler_stats',
  TEAM: 'barcode_battler_team'
};

/**
 * Save monster collection
 */
export function saveMonsters(monsters) {
  try {
    localStorage.setItem(STORAGE_KEYS.MONSTERS, JSON.stringify(monsters));
    return true;
  } catch (error) {
    console.error('Failed to save monsters:', error);
    return false;
  }
}

/**
 * Load monster collection
 */
export function loadMonsters() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MONSTERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load monsters:', error);
    return [];
  }
}

/**
 * Add monster to collection (checks for duplicates)
 */
export function addMonster(monster) {
  const monsters = loadMonsters();
  
  // Check if we already have this monster
  const exists = monsters.some(m => m.id === monster.id);
  
  if (exists) {
    return { success: false, reason: 'DUPLICATE', monster };
  }

  monsters.push(monster);
  saveMonsters(monsters);
  
  return { success: true, reason: 'NEW', monster };
}

/**
 * Update a monster (for HP changes, level ups, etc)
 */
export function updateMonster(monsterId, updates) {
  const monsters = loadMonsters();
  const index = monsters.findIndex(m => m.id === monsterId);
  
  if (index === -1) {
    return false;
  }

  monsters[index] = { ...monsters[index], ...updates };
  saveMonsters(monsters);
  
  return true;
}

/**
 * Get a specific monster by ID
 */
export function getMonster(monsterId) {
  const monsters = loadMonsters();
  return monsters.find(m => m.id === monsterId) || null;
}

/**
 * Save/load items
 */
export function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error('Failed to save items:', error);
    return false;
  }
}

export function loadItems() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load items:', error);
    return [];
  }
}

export function addItem(item) {
  const items = loadItems();
  items.push(item);
  saveItems(items);
  return true;
}

/**
 * Remove an item from inventory (by index)
 */
export function removeItem(index) {
  const items = loadItems();
  if (index < 0 || index >= items.length) {
    return false;
  }
  items.splice(index, 1);
  saveItems(items);
  return true;
}

/**
 * Remove an item by matching its obtainedAt timestamp (unique identifier)
 */
export function removeItemByTimestamp(timestamp) {
  const items = loadItems();
  const index = items.findIndex(item => item.obtainedAt === timestamp);
  if (index === -1) {
    return false;
  }
  items.splice(index, 1);
  saveItems(items);
  return true;
}

/**
 * Save/load player stats
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('Failed to save stats:', error);
    return false;
  }
}

export function loadStats() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? JSON.parse(data) : {
      totalScans: 0,
      battlesWon: 0,
      battlesLost: 0,
      monstersCollected: 0,
      itemsCollected: 0
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
    return {
      totalScans: 0,
      battlesWon: 0,
      battlesLost: 0,
      monstersCollected: 0,
      itemsCollected: 0
    };
  }
}

export function incrementStat(statName) {
  const stats = loadStats();
  stats[statName] = (stats[statName] || 0) + 1;
  saveStats(stats);
}

/**
 * Save/load battle team
 */
export function saveTeam(team) {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
    return true;
  } catch (error) {
    console.error('Failed to save team:', error);
    return false;
  }
}

export function loadTeam() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEAM);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load team:', error);
    return [];
  }
}

/**
 * Clear all data (for testing/reset)
 */
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}