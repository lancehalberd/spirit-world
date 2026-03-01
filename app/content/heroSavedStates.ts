import { SPAWN_DREAM_ENTRANCE } from "./spawnLocations";
import { cloneDeep } from "app/utils/index";
import { getDefaultSavedState } from "app/savedState";
import { applyItemsToSavedState } from "app/utils/applyItemsToSavedState";

export const altGolemState: SavedHeroData = {
    playTime: 0,
    winTime: 0,
    maxLife: 4,
    ironSkinLife: 0,
    equippedBoots: 'leatherBoots',
    previousBoots: 'leatherBoots',
    hasRevive: false,
    money: 0,
    aether: 0,
    karma: 0,
    aetherCrystals: 0,
    silverOre: 0,
    totalSilverOre: 0,
    goldOre: 0,
    totalGoldOre: 0,
    peachQuarters: 0,
    spiritTokens: 0,
    victoryPoints: 0,
    weapon: 0,
    weaponUpgrades: {},
    activeTools: {
        bow: 0,
        staff: 0,
        clone: 0,
        cloak: 0,
    },
    blueprints: {
        spikeBoots: 0,
        flyingBoots: 0,
        forgeBoots: 0,
    },
    element: null,
    elements: {
        fire: 0,
        ice: 0,
        lightning: 0,
    },
    equipment: {
        leatherBoots: 1,
        cloudBoots: 0,
        ironBoots: 0,
    },
    passiveTools: {
        nimbusCloud: 0,
        gloves: 1,
        roll: 0,
        catEyes: 0,
        spiritSight: 0,
        trueSight: 0,
        astralProjection: 0,
        teleportation: 0,
        ironSkin: 0,
        goldMail: 0,
        phoenixCrown: 0,
        waterBlessing: 0,
        fireBlessing: 0,
        lightningBlessing: 0,
        arDevice: 0,
    },
    
    spawnLocation: cloneDeep(SPAWN_DREAM_ENTRANCE),
}



const defaultSavedState = getDefaultSavedState();
const peachBossState = applyItemsToSavedState(defaultSavedState, {weapon: 1, money: 50, secondChance: 1},
    ['peachCaveWeapon', 'peachCaveSprout1', 'peachCaveSprout2']
);
const peachBossDefeatedState = applyItemsToSavedState(peachBossState, {},
    ['peachCaveBoss']
);
const peachCaveExitState = applyItemsToSavedState(peachBossDefeatedState, {maxLife: 1, catEyes: 1},
    ['peachCaveTree', 'peachCave:fullPeach', 'homeInstructions']
);
const tombRivalStateStory = applyItemsToSavedState(peachCaveExitState, {bow: 1},
    ['momElder', 'treeVillageBow', 'closedBowDoor', 'elderTomb']
);
tombRivalStateStory.savedHeroData.leftTool = 'bow';
const tombRivalDefeatState = applyItemsToSavedState(tombRivalStateStory, {}, ['tombRivalEnraged', 'tombRivalFightStarted']);
tombRivalDefeatState.savedHeroData.life = 0.25;
const tombStartState = applyItemsToSavedState(tombRivalStateStory, {},
    ['tombEntrance', 'enteredTomb']
);
const tombBossState = applyItemsToSavedState(tombStartState, {roll: 1, 'tomb:bigKey': 1, 'tomb:map': 1, silverOre: 1},
    ['tombKey1', 'tombKey2', 'tombBigKey', 'tombRoll']
);
const warTempleStart = applyItemsToSavedState(tombBossState, {maxLife: 1, spiritSight: 1},
    ['tombBoss', 'tombTeleporter', 'momRuins', 'warTempleEntrance']);
const warTempleBoss = applyItemsToSavedState(warTempleStart, {gloves: 1, 'warTemple:bigKey': 1, 'warTemple:map': 1});
const warTempleEnd = applyItemsToSavedState(warTempleBoss, {maxLife: 1, astralProjection: 1}, ['warTempleBoss']);
const cocoonStartState = applyItemsToSavedState(warTempleEnd, {maxLife: 1, astralProjection: 1, normalRange: 1},
    ['jadeChampionWarTemple', 'tombExit']);
const cocoonBossState = applyItemsToSavedState(cocoonStartState, {'cocoon:bigKey': 1, 'cloak': 1}, []);
cocoonBossState.savedHeroData.rightTool = 'cloak';
const vanaraDreamStateStory = applyItemsToSavedState(cocoonBossState, {maxLife: 1},
    ['cocoonBossStarted', 'cocoonBoss']);
const helixRivalStateStory = applyItemsToSavedState(vanaraDreamStateStory, {teleportation: 1},
    ['teleportationTutorialSwitch']);
const helixRivalStateBoss = applyItemsToSavedState(helixRivalStateStory, {}, ['skipRivalHelixStory']);


export let altRival2 = cloneDeep(helixRivalStateBoss.savedHeroData);
altRival2.hasRevive = false;
altRival2.activeTools.cloak = 0;

export let altElementalIdols = cloneDeep(warTempleBoss.savedHeroData);
altElementalIdols.hasRevive = false;
altElementalIdols.passiveTools.roll = 0;

export let altGuardian = cloneDeep(cocoonBossState.savedHeroData);
altGuardian.hasRevive = false;
altGuardian.weapon = 0;