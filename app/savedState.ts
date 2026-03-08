import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {cloneDeep} from 'app/utils/index';

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
        aether: 0,
        karma: 0,
        weapon: 0,
        weaponUpgrades: {},
        activeTools: {
            bow: 0,
            staff: 0,
            clone: 0,
            cloak: 0,
        },
        collectibles: {
            peach: 0,
            peachOfImmortality: 0,
            peachOfImmortalityPiece: 0,
            silverOre: 0,
            goldOre: 0,
            victoryPoint: 0,
            magicBeans: 0,
            aetherCrystal: 0,
        },
        collectibleTotals: {
            peach: 0,
            peachOfImmortality: 0,
            peachOfImmortalityPiece: 0,
            silverOre: 0,
            goldOre: 0,
            victoryPoint: 0,
            magicBeans: 0,
            aetherCrystal: 0,
        },
        consumables: {
            healthPotion: 0,
            statusPotion: 0,
            magicPotion: 0,
        },
        consumableTotals: {
            healthPotion: 0,
            statusPotion: 0,
            magicPotion: 0,
        },
        blueprints: {
            spikeBoots: 0,
            flyingBoots: 0,
            forgeBoots: 0,
            silverMailSchematics: 0,
            goldMailSchematics: 0,
            healthPotionSchematics: 0,
            statusPotionSchematics: 0,
            magicPotionSchematics: 0,
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
            armor: 0,
            phoenixCrown: 0,
            waterBlessing: 0,
            fireBlessing: 0,
            lightningBlessing: 0,
            arDevice: 0,
            peachBasket: 0,
        },
        // Data from this function is considered mutable, so we need to return a copy of
        // this spawn location to avoid accidentally modifying it in the future.
        spawnLocation: cloneDeep(SPAWN_LOCATION_FULL),
    };
}
