/**
 * Static zone data mirrored from the website's src/lib/data/Zones.ts.
 * Used by the bot for display purposes (names, descriptions, level reqs, tier info).
 * The actual travel validation happens server-side.
 */

export interface ZoneInfo {
  id: number;
  name: string;
  description: string;
  levelReq: number;
  tier: string;
  rarityCap: string;
  combatChance: number;
  tollCost: number;
}

const TIER_NAMES: Record<number, string> = {
  1: 'The Apprentice',
  2: 'The Adventurer',
  3: 'The Hero',
  4: 'The Ascendant',
  5: 'The Cosmic'
};

function getTier(zoneId: number): string {
  if (zoneId <= 4) return TIER_NAMES[1];
  if (zoneId <= 8) return TIER_NAMES[2];
  if (zoneId <= 11) return TIER_NAMES[3];
  if (zoneId <= 15) return TIER_NAMES[4];
  if (zoneId <= 20) return TIER_NAMES[5];
  return 'Beyond';
}

export const ZONES: ZoneInfo[] = [
  {
    id: 1,
    name: 'Greenleaf Meadow',
    description: 'A safe haven for beginners. Slimes and lost trinkets abound.',
    levelReq: 1,
    tier: getTier(1),
    rarityCap: 'Uncommon',
    combatChance: 10,
    tollCost: 0
  },
  {
    id: 2,
    name: 'Misty Creek',
    description: 'The fog hides goblins, but the river washes up gold.',
    levelReq: 5,
    tier: getTier(2),
    rarityCap: 'Uncommon',
    combatChance: 12,
    tollCost: 0
  },
  {
    id: 3,
    name: "Bandit's Highway",
    description:
      'A dangerous trade route. High risk, but the thieves are wealthy.',
    levelReq: 10,
    tier: getTier(3),
    rarityCap: 'Rare',
    combatChance: 18,
    tollCost: 0
  },
  {
    id: 4,
    name: 'Whispering Woods',
    description: 'Ancient trees that hum with magic. Good for training.',
    levelReq: 15,
    tier: getTier(4),
    rarityCap: 'Rare',
    combatChance: 15,
    tollCost: 0
  },
  {
    id: 5,
    name: 'Crumbling Ruins',
    description: 'The remains of an old kingdom. Undead guard the treasures.',
    levelReq: 25,
    tier: getTier(5),
    rarityCap: 'Elite',
    combatChance: 20,
    tollCost: 0
  },
  {
    id: 6,
    name: 'Sunken Grotto',
    description: 'Damp, dark, and filled with glowing crystals.',
    levelReq: 35,
    tier: getTier(6),
    rarityCap: 'Elite',
    combatChance: 18,
    tollCost: 0
  },
  {
    id: 7,
    name: 'Ironclad Fortress',
    description: 'A stronghold of elite soldiers. Brutal combat training.',
    levelReq: 50,
    tier: getTier(7),
    rarityCap: 'Epic',
    combatChance: 30,
    tollCost: 5
  },
  {
    id: 8,
    name: 'Crystal Spire',
    description: 'A tower reaching for the heavens. The air hums with power.',
    levelReq: 75,
    tier: getTier(8),
    rarityCap: 'Epic',
    combatChance: 22,
    tollCost: 10
  },
  {
    id: 9,
    name: 'Molten Core',
    description: 'The heat is unbearable. Only the strongest survive.',
    levelReq: 100,
    tier: getTier(9),
    rarityCap: 'Legendary',
    combatChance: 28,
    tollCost: 25
  },
  {
    id: 10,
    name: "The Void's Edge",
    description: 'Reality flickers here. The loot is otherworldly.',
    levelReq: 150,
    tier: getTier(10),
    rarityCap: 'Legendary',
    combatChance: 35,
    tollCost: 50
  },
  {
    id: 11,
    name: "Dragon's Fall",
    description: 'The impact site of the Great Fall. The source of all magic.',
    levelReq: 200,
    tier: getTier(11),
    rarityCap: 'Divine',
    combatChance: 45,
    tollCost: 100
  },
  {
    id: 12,
    name: 'Plane of Eternal Fire',
    description: 'The ground itself is alive. Elementals roam freely.',
    levelReq: 250,
    tier: getTier(12),
    rarityCap: 'Divine',
    combatChance: 40,
    tollCost: 150
  },
  {
    id: 13,
    name: 'Glacial Expanse',
    description: 'Time moves slower here. The cold stops the heart.',
    levelReq: 300,
    tier: getTier(13),
    rarityCap: 'Divine',
    combatChance: 42,
    tollCost: 200
  },
  {
    id: 14,
    name: 'Thunderpeak',
    description: 'A mountain peak above the clouds. Storms never cease.',
    levelReq: 350,
    tier: getTier(14),
    rarityCap: 'Divine',
    combatChance: 45,
    tollCost: 300
  },
  {
    id: 15,
    name: "Titan's Grave",
    description: 'Where the giants fell. Their bones form the landscape.',
    levelReq: 400,
    tier: getTier(15),
    rarityCap: 'Divine',
    combatChance: 48,
    tollCost: 400
  },
  {
    id: 16,
    name: 'Stardust Sanctuary',
    description: 'Gravity is a suggestion here. Stars drift like sand.',
    levelReq: 500,
    tier: getTier(16),
    rarityCap: 'Divine',
    combatChance: 35,
    tollCost: 500
  },
  {
    id: 17,
    name: 'Nebula of Souls',
    description: 'The spirits of the ancients watch your every step.',
    levelReq: 600,
    tier: getTier(17),
    rarityCap: 'Divine',
    combatChance: 40,
    tollCost: 650
  },
  {
    id: 18,
    name: 'Black Hole Horizon',
    description: 'Light cannot escape. Hope struggles to survive.',
    levelReq: 700,
    tier: getTier(18),
    rarityCap: 'Divine',
    combatChance: 50,
    tollCost: 800
  },
  {
    id: 19,
    name: "Creation's Forge",
    description: 'Where worlds are made and destroyed.',
    levelReq: 800,
    tier: getTier(19),
    rarityCap: 'Divine',
    combatChance: 55,
    tollCost: 1000
  },
  {
    id: 20,
    name: 'The Absolute',
    description: 'The end of all things. The beginning of eternity.',
    levelReq: 900,
    tier: getTier(20),
    rarityCap: 'Divine',
    combatChance: 60,
    tollCost: 1200
  }
];

export function getZone(id: number): ZoneInfo | undefined {
  return ZONES.find((z) => z.id === id);
}

export function getAccessibleZones(playerLevel: number): ZoneInfo[] {
  return ZONES.filter((z) => playerLevel >= z.levelReq);
}

export function getAllZones(): ZoneInfo[] {
  return ZONES;
}
