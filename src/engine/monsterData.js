// Monster Data System
// 126 total monsters: 42 Arcane, 42 Primal, 42 Divine
// Names escalate in "epicness" - early IDs are simpler, later IDs are legendary

export const TYPES = {
  ARCANE: 'ARCANE',   // Purple/Mystic - beats Primal
  PRIMAL: 'PRIMAL',   // Green/Savage - beats Divine
  DIVINE: 'DIVINE'    // Gold/Radiant - beats Arcane
};

export const CLASSES = {
  MAGIC: 'MAGIC',
  TECH: 'TECH',
  POWER: 'POWER'
};

// Type advantage triangle
export function getTypeAdvantage(attackerType, defenderType) {
  if (attackerType === defenderType) return 'NEUTRAL';
  
  const advantages = {
    [TYPES.ARCANE]: TYPES.PRIMAL,   // Arcane beats Primal
    [TYPES.PRIMAL]: TYPES.DIVINE,   // Primal beats Divine
    [TYPES.DIVINE]: TYPES.ARCANE    // Divine beats Arcane
  };

  if (advantages[attackerType] === defenderType) {
    return 'ADVANTAGE';
  }
  return 'DISADVANTAGE';
}

// All 126 Monster Names
// ARCANE (1-42): Dark fantasy, shadow/void/mystic themes
// PRIMAL (43-84): Savage beasts, nature's fury, feral themes
// DIVINE (85-126): Holy, celestial, radiant themes

export const MONSTER_NAMES = {
  // ===== ARCANE MONSTERS (1-42) =====
  // Common tier (1-10)
  1: "Shadowmaw",
  2: "Voidling",
  3: "Grimshade",
  4: "Hexwyrm",
  5: "Darkwisp",
  6: "Nightcrawl",
  7: "Murkling",
  8: "Gloomfang",
  9: "Duskling",
  10: "Shadeborn",
  
  // Uncommon tier (11-20)
  11: "Netherspite",
  12: "Curseling",
  13: "Voidcaller",
  14: "Grimspell",
  15: "Hexblade",
  16: "Shadowveil",
  17: "Darkhollow",
  18: "Blightcaster",
  19: "Dreadshade",
  20: "Wraithling",
  
  // Rare tier (21-30)
  21: "Nullweaver",
  22: "Abysstalker",
  23: "Voidreaper",
  24: "Dreadmaw",
  25: "Soulrender",
  26: "Netherbane",
  27: "Grimtalon",
  28: "Shadowfiend",
  29: "Darkterror",
  30: "Blightwraith",
  
  // Epic tier (31-38)
  31: "Malachar the Hollow",
  32: "Nyx Voidborn",
  33: "Oblivion Maw",
  34: "Xeth'rul the Cursed",
  35: "Nethrazim",
  36: "Void Archon",
  37: "Grimhollow Prime",
  38: "Dreadlord Kha'zix",
  
  // Legendary tier (39-42)
  39: "Azrathos the Undying",
  40: "Vexorath World-Eater",
  41: "Nul'Karath the Endless",
  42: "Xerath'vol, Lord of the Void",

  // ===== PRIMAL MONSTERS (43-84) =====
  // Common tier (43-52)
  43: "Thornfang",
  44: "Razorclaw",
  45: "Bristleback",
  46: "Mossling",
  47: "Fangroot",
  48: "Snareclaw",
  49: "Bramblebite",
  50: "Mudmaw",
  51: "Rocksnapper",
  52: "Ferntooth",
  
  // Uncommon tier (53-62)
  53: "Wildthorn",
  54: "Bonecrusher",
  55: "Venomback",
  56: "Ironhide",
  57: "Stormtusk",
  58: "Gorehorn",
  59: "Savageclaw",
  60: "Wildmaw",
  61: "Thunderpelt",
  62: "Stonefury",
  
  // Rare tier (63-72)
  63: "Primal Warden",
  64: "Bloodthorn Alpha",
  65: "Apex Stalker",
  66: "Ravager Prime",
  67: "Ancient Tusker",
  68: "Dire Fangmother",
  69: "Beastlord Karn",
  70: "Goremaw the Savage",
  71: "Alpha Dreadclaw",
  72: "Earthshaker Rex",
  
  // Epic tier (73-80)
  73: "Groth the Unyielding",
  74: "Korgath Bonelord",
  75: "Thornmother Velika",
  76: "Rageclaw Behemoth",
  77: "Primal Titan",
  78: "Ur'gash the Ancient",
  79: "Worldbreaker Kha",
  80: "Apex Devourer",
  
  // Legendary tier (81-84)
  81: "Gaia's Wrath",
  82: "Kron'thar the Primeval",
  83: "Ur-Beast Gorath",
  84: "Zephyrax, First Predator",

  // ===== DIVINE MONSTERS (85-126) =====
  // Common tier (85-94)
  85: "Lightbringer",
  86: "Seraphtail",
  87: "Dawnling",
  88: "Halokin",
  89: "Sunwisp",
  90: "Glimmer",
  91: "Raysprite",
  92: "Auraglow",
  93: "Sparkwing",
  94: "Luminette",
  
  // Uncommon tier (95-104)
  95: "Dawnblade",
  96: "Solarian",
  97: "Radiant Watcher",
  98: "Valkyrin",
  99: "Celestine",
  100: "Sanctis",
  101: "Aurelius",
  102: "Starweaver",
  103: "Emberheart",
  104: "Dawnguard",
  
  // Rare tier (105-114)
  105: "Seraph Knight",
  106: "Solaris Prime",
  107: "Exalted Luminar",
  108: "Archon of Dawn",
  109: "Celestial Warden",
  110: "Radiant Justicar",
  111: "Phoenix Ascendant",
  112: "Beacon of Valor",
  113: "Sunforge Titan",
  114: "Herald of Light",
  
  // Epic tier (115-122)
  115: "Aethon the Radiant",
  116: "Solarius Maxima",
  117: "Archangel Tyreus",
  118: "Exalted One",
  119: "Zenith Guardian",
  120: "Luminos Prime",
  121: "Celestial Arbiter",
  122: "Paragos the Just",
  
  // Legendary tier (123-126)
  123: "Seraphiel, Voice of Dawn",
  124: "Aurorath the Eternal",
  125: "Solanthus, Sun Emperor",
  126: "Luxara, First Light"
};

// Stat variations based on position within type (adds variety)
function generateStats(id) {
  // Base stats with some variation based on ID
  const typeOffset = id <= 42 ? 0 : id <= 84 ? 42 : 84;
  const positionInType = id - typeOffset;
  
  // Later monsters in each type have slightly better base stats
  const tierBonus = Math.floor(positionInType / 14); // 0, 1, or 2
  
  // Add some pseudo-random variation based on ID
  const seed = (id * 7) % 5;
  
  return {
    hp: 10 + tierBonus * 2 + (id % 4),
    attack: 6 + tierBonus + ((id + 1) % 3),
    defense: 5 + tierBonus + ((id + 2) % 3),
    speed: 6 + tierBonus + (id % 3)
  };
}

// Determine class based on position within type
function getMonsterClass(id) {
  const typeOffset = id <= 42 ? 0 : id <= 84 ? 42 : 84;
  const positionInType = ((id - typeOffset - 1) % 42);
  
  if (positionInType < 14) return CLASSES.MAGIC;
  if (positionInType < 28) return CLASSES.TECH;
  return CLASSES.POWER;
}

// Determine type based on ID
function getMonsterType(id) {
  if (id <= 42) return TYPES.ARCANE;
  if (id <= 84) return TYPES.PRIMAL;
  return TYPES.DIVINE;
}

/**
 * Create a monster instance from ID and barcode
 */
export function createMonster(monsterId, barcodeString) {
  const name = MONSTER_NAMES[monsterId] || `Unknown #${monsterId}`;
  const type = getMonsterType(monsterId);
  const monsterClass = getMonsterClass(monsterId);
  const stats = generateStats(monsterId);

  return {
    id: monsterId,
    name: name,
    type: type,
    class: monsterClass,
    baseStats: { ...stats },
    caughtFrom: barcodeString,
    currentHP: stats.hp,
    maxHP: stats.hp,
    level: 1,
    exp: 0
  };
}

/**
 * Get monster type color for UI
 */
export function getTypeColor(type) {
  switch (type) {
    case TYPES.ARCANE:
      return '#9333EA'; // Purple
    case TYPES.PRIMAL:
      return '#16A34A'; // Green
    case TYPES.DIVINE:
      return '#EAB308'; // Gold
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Calculate damage modifier based on type advantage
 */
export function getDamageModifier(attackerType, defenderType) {
  const advantage = getTypeAdvantage(attackerType, defenderType);
  
  switch (advantage) {
    case 'ADVANTAGE':
      return 1;
    case 'DISADVANTAGE':
      return -1;
    case 'NEUTRAL':
    default:
      return 0;
  }
}

/**
 * Get monster rarity based on ID position within type
 */
export function getMonsterRarity(monsterId) {
  const typeOffset = monsterId <= 42 ? 0 : monsterId <= 84 ? 42 : 84;
  const positionInType = monsterId - typeOffset;
  
  if (positionInType <= 10) return 'COMMON';
  if (positionInType <= 20) return 'UNCOMMON';
  if (positionInType <= 30) return 'RARE';
  if (positionInType <= 38) return 'EPIC';
  return 'LEGENDARY';
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity) {
  switch (rarity) {
    case 'COMMON': return '#9CA3AF';     // Gray
    case 'UNCOMMON': return '#22C55E';   // Green
    case 'RARE': return '#3B82F6';       // Blue
    case 'EPIC': return '#A855F7';       // Purple
    case 'LEGENDARY': return '#F59E0B';  // Gold/Orange
    default: return '#9CA3AF';
  }
}

/**
 * Get monster name by ID (for updating old saved monsters)
 */
export function getMonsterName(monsterId) {
  return MONSTER_NAMES[monsterId] || `Unknown #${monsterId}`;
}