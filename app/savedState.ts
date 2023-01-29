import { SPAWN_LOCATION_FULL } from 'app/content/spawnLocations';

import { SavedHeroData, SavedState } from 'app/types';

export function getDefaultSavedState(): SavedState {
    return {
        dungeonInventories: {},
        objectFlags: {},
        zoneFlags: {},
        luckyBeetles: [],
        savedHeroData: getDefaultSavedHeroData(),
        staffTowerLocation: 'desert',
    };
}

function getDefaultSavedHeroData(): SavedHeroData {
    return {
        playTime: 0,
        winTime: 0,
        maxLife: 4,
        hasRevive: false,
        money: 0,
        silverOre: 0,
        goldOre: 0,
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
            gloves: 0,
            roll: 0,
            nimbusCloud: 0,
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
