import { dialogueHash } from 'app/content/dialogue/dialogueHash';

import { addBurstEffect } from 'app/content/effects/animationEffect';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';



// Currently only one default entrance is supported for each dungeon.
// Eventually we should track the last entrance used by the player and
// pick that specific entry by tracking something like:
// escapeExit: `${zone}:${entranceId}:${isSpiritWorld}`
// Then we can use that exact key for returning, and use a small map
// for things like pits to map to some reasonable alternative,
// or add the ability for entering a zone from a pit.
export const zoneEntranceMap: {[key in LogicalZoneKey]?: string} = {
    'peachCave': 'overworld:peachCaveTopEntrance',
    // peachCaveWaterEntrance
    'tomb': 'overworld:tombEntrance',
    // tombTeleporter
    'warTemple': 'overworld:warTempleEntrance',
    // warTempleNorthEntrance
    // warTempleNortheastEntrance
    // warTempleChestEntrance
    // warTempleEastEntrance
    // warTempleKeyDoor
    // warTemplePeachEntrance(pit) -> warTempleKeyDoor
    'cocoon': 'tomb:tombExit',
    // tombEntrance
    'helix': 'lakeTunnel:helixEntrance',
    // helixSkyEntrance
    'forestTemple': 'forest:forestTempleEastTreeEntrance',
    'waterfallTower': 'overworld:waterfallTowerEntrance',
     // waterfallTowerTopEntrance
    'forge': 'sky:forgeEntrance',
    // These are both considered part of the overworld now.
    //'grandTemple': 'overworld:grandTempleEntrance',
    //'jadePalace': 'overworld:jadePalaceEntrance',
    'gauntlet': 'grandTemple:gauntletEntrance',
    'skyPalace': 'sky:skyPalaceEntrance',
    'holySanctum': 'grandTemple:holySanctumEntrance',
    'riverTemple': 'overworld:riverTempleUpperEntrance',
    // underwater:riverTempleWaterEntrance
    'staffTower': 'overworld:staffTowerEntrance',
    // sky:staffTowerSkyEntrance
    // overworld:staffTowerSpiritEntrance
    // sky:staffTowerSpiritSkyEntrance
    'crater': 'sky:craterEntrance',
    'warPalace': 'overworld:warTempleEntranceSpirit',
    'lab': 'warTemple:labEntrance',
    'tree': 'lab:treeEntrance',
    'void': 'lab:treeEntrance',
};

function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
    if (enterZoneByTarget(state, zoneKey, markerId, {instant: true})) {
        burstIntoLocation(state);
    }
    return '';
}
function burstIntoLocation(state: GameState) {
    state.hero.action = null;
    state.hero.isAirborn = true;
    state.hero.animationTime = 0;
    state.hero.z = 4;
    state.hero.vx = state.hero.vy = 0;
    state.hero.vz = -1;
    state.hero.safeD = state.hero.d;
    state.hero.safeX = state.hero.x;
    state.hero.safeY = state.hero.y;

    addBurstEffect(state, state.hero)
}

dialogueHash.nimbusCloud = {
    key: 'nimbusCloud',
    mappedOptions: {
        returnMenu: `{choice:Return?|No:nimbusCloud.no|Last Save:nimbusCloud.returnToLastSave|Home:nimbusCloud.returnToHome}`,
        returnToHome: (state: GameState) => travelToLocation(state, 'overworld', 'waterfallMarker'),
        returnToLastSave: (state: GameState) => {
            returnToSpawnLocation(state);
            burstIntoLocation(state);
            return '';
        },
        chooseDestination: (state: GameState) => {
            if (state.location.zoneKey === 'dream') {
                return `The Nimbus Cloud won't appear in the Dreaming.`;
            }
            // There is a section of the sky that is part of the Sky Palace logical zone, but since it is outside,
            // it should *not* show the return to entrance option.
            if (state.location.zoneKey !== 'sky' && zoneEntranceMap[state.location.logicalZoneKey]) {
                return `
                {choice:Return to entrance?|Yes:nimbusCloud.returnToEntrance|No:nimbusCloud.no}`;
            }
            if (state.location.isSpiritWorld) {
                return `{choice:Where to?
                        |Jade Palace:nimbusCloud.jadePalace
                        |Shop:nimbusCloud.spiritShop
                        |Fertility Temple:nimbusCloud.forestTemple
                        |Sky:nimbusCloud.skyCity
                        |City:nimbusCloud.jadeCity
                        |Nevermind:nimbusCloud.no
                        }`;
            }
            if (!state.location.isSpiritWorld && state.zone.surfaceKey) {
                return `The Nimbus Cloud won't appear underwater.`;
            }
            return `{choice:Where to?
                    |Grand Temple:nimbusCloud.grandTemple
                    |Lake:nimbusCloud.lake
                    |City:nimbusCloud.holyCity
                    |Forest:nimbusCloud.vanaraVillage
                    |Peaks:nimbusCloud.crater
                    |Ruins:nimbusCloud.summonerRuins
                    |Nevermind:nimbusCloud.no
                    }`;
            // return `For some reason, the Nimbus Cloud doesn't appear.`;
        },
        returnToEntrance: (state: GameState) => {
            const [zoneKey, ...rest] = zoneEntranceMap[state.location.logicalZoneKey].split(':', );
            enterZoneByTarget(state, zoneKey, rest.join(':'));
            return '';
        },
        // Material world destinations
        grandTemple: (state: GameState) => travelToLocation(state, 'grandTemple', 'portalMarker'),
        lake: (state: GameState) => travelToLocation(state, 'overworld', 'lakeMarker'),
        holyCity: (state: GameState) => travelToLocation(state, 'overworld', 'holyCityMarker'),
        vanaraVillage: (state: GameState) => travelToLocation(state, 'forest', 'vanaraVillageMarker'),
        crater: (state: GameState) => travelToLocation(state, 'sky', 'craterMarker'),
        summonerRuins: (state: GameState) => travelToLocation(state, 'overworld', 'summonerRuinsMarker'),
        // Spirit world destinations
        jadePalace: (state: GameState) => travelToLocation(state, 'grandTemple', 'spiritPortalMarker'),
        spiritShop: (state: GameState) => travelToLocation(state, 'overworld', 'spiritShopMarker'),
        forestTemple: (state: GameState) => travelToLocation(state, 'overworld', 'forestTempleMarker'),
        skyCity: (state: GameState) => travelToLocation(state, 'sky', 'skyCityMarker'),
        jadeCity: (state: GameState) => travelToLocation(state, 'overworld', 'jadeCityMarker'),
        no: '',
    },
    options: [],
};
