import { SPAWN_LOCATION_FULL } from 'app/content/spawnLocations';

export function getDefaultSavedState(): SavedState {
    return {
        dungeonInventories: {},
        // Used to track what parts of the map are displayed.
        exploredSections: [],
        // Used to track what dialogue the player has heard.
        heardDialogue: [],
        objectFlags: {},
        zoneFlags: {},
        luckyBeetles: [],
        savedHeroData: getDefaultSavedHeroData(),
        savedArData: {gameData: {}},
        staffTowerLocation: 'desert',
    };
}

function getDefaultSavedHeroData(): SavedHeroData {
    return {
        playTime: 0,
        winTime: 0,
        maxLife: 4,
        ironSkinLife: 0,
        equippedBoots: 'leatherBoots',
        previousBoots: 'leatherBoots',
        hasRevive: false,
        money: 0,
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
            gloves: 0,
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
        },
        spawnLocation: SPAWN_LOCATION_FULL,
    };
}
