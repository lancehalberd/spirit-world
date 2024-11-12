import * as spawnLocations from 'app/content/spawnLocations';
import { getDefaultSavedState } from 'app/savedState'
import { cloneDeep } from 'app/utils/index';

const weaponUpgradeKeys: WeaponUpgrades[] = ['normalDamage', 'normalRange', 'spiritDamage', 'spiritRange'];

function applyItems(savedState: SavedState, items: {[key: string]: number}, objectFlags: string[] = []): SavedState {
    const newState: SavedState = cloneDeep(savedState);
    for (const flag of objectFlags) {
        newState.objectFlags[flag] = true;
    }
    for (let key in items) {
        if (key === 'maxLife') {
            newState.savedHeroData.maxLife += items[key];
            continue;
        }
        if (key === 'secondChance') {
            newState.savedHeroData.hasRevive = true;
            continue;
        }
        if (key === 'money') {
            newState.savedHeroData.money += items[key];
            continue;
        }
        if (key === 'silverOre') {
            newState.savedHeroData.silverOre += items[key];
            continue;
        }
        if (key === 'goldOre') {
            newState.savedHeroData.goldOre += items[key];
            continue;
        }
        if (key === 'weapon') {
            newState.savedHeroData.weapon = items[key];
            continue;
        }
        if (weaponUpgradeKeys.includes(key as WeaponUpgrades)) {
            newState.savedHeroData.weaponUpgrades[key as WeaponUpgrades] = true;
            continue;
        }
        if (key.indexOf(':') >= 0) {
            const [zoneKey, item] = key.split(':');
            newState.dungeonInventories[zoneKey] = {
                ...newState.dungeonInventories[zoneKey],
                [item]: items[key],
            };
            continue;
        }
        if (typeof newState.savedHeroData.activeTools[key as ActiveTool] !== 'undefined') {
            newState.savedHeroData.activeTools[key as ActiveTool] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.elements[key as MagicElement] !== 'undefined') {
            newState.savedHeroData.elements[key as MagicElement] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.equipment[key as Equipment] !== 'undefined') {
            newState.savedHeroData.equipment[key as Equipment] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.passiveTools[key as PassiveTool] !== 'undefined') {
            newState.savedHeroData.passiveTools[key as PassiveTool] = items[key];
            continue;
        }
        console.log('Could not find key', key, items[key]);
    }
    return newState;
}

const defaultSavedState = getDefaultSavedState();
const peachBossState = applyItems(defaultSavedState, {weapon: 1, money: 50, secondChance: 1},
    ['peachCaveWeapon', 'peachCaveSprout1', 'peachCaveSprout2']
);
const peachBossDefeatedState = applyItems(peachBossState, {},
    ['peachCaveBoss']
);
const peachCaveExitState = applyItems(peachBossDefeatedState, {maxLife: 1, catEyes: 1},
    ['peachCaveTree', 'peachCave:fullPeach', 'homeInstructions']
);
const tombRivalStateStory = applyItems(peachCaveExitState, {bow: 1},
    ['momElder', 'treeVillageBow', 'closedBowDoor', 'elderTomb']
);
tombRivalStateStory.savedHeroData.leftTool = 'bow';
const tombRivalStateBoss = applyItems(tombRivalStateStory, {}, ['tombRivalEnraged', 'tombRivalFightStarted', 'skipRivalTombStory']);
const tombRivalDefeatState = applyItems(tombRivalStateStory, {}, ['tombRivalEnraged', 'tombRivalFightStarted']);
tombRivalDefeatState.savedHeroData.life = 0.25;
const tombStartState = applyItems(tombRivalStateStory, {},
    ['tombEntrance', 'enteredTomb']
);
const tombBossState = applyItems(tombStartState, {roll: 1, 'tomb:bigKey': 1, 'tomb:map': 1, silverOre: 1},
    ['tombKey1', 'tombKey2', 'tombBigKey', 'tombRoll']
);
const warTempleStart = applyItems(tombBossState, {maxLife: 1, spiritSight: 1},
    ['tombBoss', 'tombTeleporter', 'momRuins', 'warTempleEntrance']);
const warTempleBoss = applyItems(warTempleStart, {gloves: 1, 'warTemple:bigKey': 1, 'warTemple:map': 1});
const cocoonStartState = applyItems(warTempleBoss, {maxLife: 1, astralProjection: 1, normalRange: 1},
    ['warTempleBoss', 'tombExit']);
const cocoonBossState = applyItems(cocoonStartState, {'cocoon:bigKey': 1, 'cloak': 1}, []);
cocoonBossState.savedHeroData.rightTool = 'cloak';
const helixRivalStateStory = applyItems(cocoonBossState, {maxLife: 1, teleportation: 1},
    ['cocoonTeleporter']);
const helixRivalStateBoss = applyItems(helixRivalStateStory, {}, ['skipRivalHelixStory']);
const helixStartState = applyItems(helixRivalStateStory, {},
    ['helixRivalBoss']);
const helixEndState = applyItems(helixStartState, {staff: 1, normalDamage: 1, weapon: 2},
    ['elementalBeastsEscaped', 'vanaraCommanderBeasts']);
const forestStartState = applyItems(helixEndState, {}, ['spiritKingForestTemple']);
const forestBossState = applyItems(forestStartState, {cloudBoots: 1, 'forestTemple:bigKey': 1},
    ['spiritKingForestTemple']);
const waterfallBossState = applyItems(helixEndState, {ironBoots: 1});

const gauntletStartState = applyItems(helixEndState, {
    clone: 1, cloudBoots: 1, gloves: 2, cloak: 2, nimbusCloud: 1, roll: 2
}, []);

const skyPalaceStartState = applyItems(helixEndState, {
    maxLife: 3,
    clone: 1, cloudBoots: 1,
    ironBoots: 1, cloak: 2,
    gloves: 2, goldMail: 1,
}, []);

const holySanctumStartState = applyItems(helixEndState, {
    maxLife: 5,
    gloves: 2, goldMail: 1,
    cloudBoots: 1, clone: 1,
    trueSight: 1, ironSkin: 1,
    ironBoots:1, cloak: 2,
    nimbusCloud: 1, roll: 2,
    staff: 2, lightning: 1,
    fireBlessing: 1, fire: 1,
    waterBlessing: 1, ice: 1,
}, []);

const beastState = applyItems(helixEndState, {
    maxLife: 7,
    lightningBlessing: 1, goldOre: 2,
    cloudBoots: 1, clone: 1,
    ironBoots: 1, cloak: 2,
    trueSight: 1, ironSkin: 1,
    gloves: 2, goldMail: 1,
    roll: 2, nimbusCloud: 1,
    bow: 2,
    spiritDamage: 1, spiritRange: 1,
});

const riverTempleStartState = applyItems(beastState, {
    staff: 2, lightning: 1,
    fireBlessing: 1, fire: 1,
}, ['flameBeast', 'stormBeast']);
const riverTempleBossState = applyItems(riverTempleStartState,
    {'riverTemple:bigKey': 1, 'fire': 1, 'lightning': 1},
    ['bossBubblesNorth','bossBubblesSouth', 'bossBubblesWest', 'bossBubblesEast']
);

const craterStartState = applyItems(beastState, {
    staff: 2, lightning: 1,
    waterBlessing: 1, ice: 1
}, ['frostBeast', 'stormBeast']);
const craterBossState = applyItems(craterStartState, {fireBlessing: 1},
    ['craterLava1', 'craterLava2', 'craterLava3', 'craterLava4', 'craterLava5']
);

const staffStartState = applyItems(beastState, {
    fireBlessing: 1, fire: 1,
    waterBlessing: 1, ice: 1
}, ['frostBeast', 'flameBeast']);
const staffBossState = applyItems(staffStartState, {}, [
    'staffTowerSpiritEntrance', 'tower2FBarrier',
    'elevatorDropped', 'elevatorFixed',
    'tower3FBarrier', 'staffTowerSkyEntrance',
]);
const staffAquiredState = applyItems(staffBossState, {lightning: 1}, [
    'stormBeast',
    'staffTowerActivated'
]);

const warshipStartState = applyItems(staffAquiredState, {staff: 2, phoenixCrown: 1});

const finalBoss1State = applyItems(warshipStartState, {clone: 2, maxLife: 5});


export interface SpawnLocationOptions {
    [key: string]: {location: ZoneLocation, savedState: SavedState},
}

export const easyBossSpawnLocations: SpawnLocationOptions = {
    'Giant Beetle': {
        location: spawnLocations.SPAWN_LOCATION_PEACH_CAVE_BOSS,
        savedState: peachBossState,
    },
    'Tomb Rival': {
        location: spawnLocations.SPAWN_LOCATION_TOMB_RIVAL,
        savedState: tombRivalStateBoss,
    },
    'Golem': {
        location: spawnLocations.SPAWN_LOCATION_TOMB_BOSS,
        savedState: tombBossState,
    },
    'Elemental Idols': {
        location: spawnLocations.SPAWN_WAR_TEMPLE_BOSS,
        savedState: warTempleBoss,
    },
    'Vanara Guardian': {
        location: spawnLocations.SPAWN_COCOON_BOSS,
        savedState: cocoonBossState,
    },
    'Helix Rival': {
        location: spawnLocations.SPAWN_LOCATION_HELIX_RIVAL,
        savedState: helixRivalStateBoss,
    },
    'Forest Boss': {
        location: spawnLocations.SPAWN_FOREST_BOSS,
        savedState: forestBossState,
    },
    'Collector': {
        location: spawnLocations.SPAWN_WATERFALL_BOSS,
        savedState: waterfallBossState,
    },
    'Flame Beast': {
        location: spawnLocations.SPAWN_CRATER_BOSS,
        savedState: craterBossState,
    },
    'Frost Beast': {
        location: spawnLocations.RIVER_TEMPLE_BOSS,
        savedState: riverTempleBossState,
    },
    'Storm Beast': {
        location: spawnLocations.SPAWN_STAFF_BOSS,
        savedState: staffBossState,
    },
    'Void Tree': {
        location: spawnLocations.SPAWN_FINAL_BOSS_1,
        savedState: finalBoss1State,
    },
};

export const storySpawnLocations: SpawnLocationOptions = {
    'Peach Cave Tree': {
        location: spawnLocations.SPAWN_LOCATION_PEACH_CAVE_BOSS,
        savedState: peachBossDefeatedState,
    },
    'Tomb Rival Fight': {
        location: spawnLocations.SPAWN_LOCATION_TOMB_RIVAL,
        savedState: tombRivalStateStory,
    },
    'Tomb Rival Defeat': {
        location: spawnLocations.SPAWN_LOCATION_TOMB_RIVAL,
        savedState: tombRivalDefeatState,
    },
    'Jade Champion War Temple': {
        location: spawnLocations.SPAWN_WAR_TEMPLE_ENTRANCE,
        savedState: cocoonStartState,
    },
    'Helix Rival Fight': {
        location: spawnLocations.SPAWN_LOCATION_LAKE_TUNNEL,
        savedState: helixRivalStateStory,
    },

};

export const earlyDungeonSpawnLocations: SpawnLocationOptions = {
    'Peach Cave': {
        location: spawnLocations.SPAWN_LOCATION_FULL,
        savedState: defaultSavedState,
    },
    'Overworld': {
        location: spawnLocations.SPAWN_LOCATION_PEACH_CAVE_EXIT,
        savedState: peachCaveExitState,
    },
    'Tomb': {
        location: spawnLocations.SPAWN_LOCATION_TOMB_ENTRANCE,
        savedState: tombStartState,
    },
    'War Temple': {
        location: spawnLocations.SPAWN_WAR_TEMPLE_ENTRANCE,
        savedState: warTempleStart,
    },
    'Cocoon': {
        location: spawnLocations.SPAWN_COCOON_ENTRANCE,
        savedState: cocoonStartState,
    },
    'Helix': {
        location: spawnLocations.SPAWN_HELIX_ENTRANCE,
        savedState: helixStartState,
    },
};

export const middleDungeonSpawnLocations: SpawnLocationOptions = {
    'Grand Temple': {
        location: spawnLocations.SPAWN_GRAND_TEMPLE_ENTRANCE,
        savedState: helixEndState,
    },
    'Forest': {
        location: spawnLocations.SPAWN_FOREST_ENTRANCE,
        savedState: forestStartState,
    },
    'Gauntlet': {
        location: spawnLocations.SPAWN_GAUNTLET_ENTRANCE,
        savedState: gauntletStartState,
    },
    'Waterfall': {
        location: spawnLocations.SPAWN_WATERFALL_ENTRANCE,
        savedState: helixEndState,
    },
    'Forge': {
        location: spawnLocations.SPAWN_FORGE_ENTRANCE,
        savedState: helixEndState,
    },
    'Sky Palace': {
        location: spawnLocations.SPAWN_SKY_PALACE_ENTRANCE,
        savedState: skyPalaceStartState,
    },
    'Holy Sanctum': {
        location: spawnLocations.SPAWN_HOLY_SANCTUM_ENTRANCE,
        savedState: holySanctumStartState,
    },
};

export const lateDungeonSpawnLocations: SpawnLocationOptions = {
    'Lake': {
        location: spawnLocations.SPAWN_LOCATION_PEACH_CAVE_EXIT,
        savedState: riverTempleStartState,
    },
    'Crater': {
        location: spawnLocations.SPAWN_CRATER_ENTRANCE,
        savedState: craterStartState,
    },
    'Tower Lower': {
        location: spawnLocations.SPAWN_STAFF_LOWER_ENTRANCE,
        savedState: staffStartState,
    },
    'Tower Upper': {
        location: spawnLocations.SPAWN_STAFF_UPPER_ENTRANCE,
        savedState: staffStartState,
    },
    'Tower Aquired': {
        location: spawnLocations.SPAWN_STAFF_LOWER_ENTRANCE,
        savedState: staffAquiredState,
    },
    'Rival 3': {
        location: spawnLocations.SPAWN_WAR_TEMPLE_ENTRANCE_SPIRIT,
        savedState: warshipStartState,
    },
};


// Minimizer states:
export const LIGHT_1_START: ZoneLocation = {
    zoneKey: 'light1',
    floor: 0,
    x: 396,
    y: 432,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};
export const LIGHT_1_BOSS: ZoneLocation = {
    zoneKey: 'light1',
    floor: 0,
    x: 374,
    y: 200,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};

const light1Start = applyItems(defaultSavedState, {weapon: 1, catEyes: 1, maxLife: 1},
    []
);
const light1Boss = applyItems(light1Start, {bow: 1, 'light1:bigKey': 1},
    []
);
export const minimizerSpawnLocations: SpawnLocationOptions = {
    'Light 1': {
        location: LIGHT_1_START,
        savedState: light1Start,
    },
    'Light 1 Boss': {
        location: LIGHT_1_BOSS,
        savedState: light1Boss,
    },
};
