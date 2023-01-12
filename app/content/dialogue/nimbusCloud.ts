import { enterZoneByTarget } from 'app/content/areas';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { returnToSpawnLocation } from 'app/state';

import { GameState } from 'app/types';


// Currently only one default entrance is supported for each dungeon.
// Eventually we should track the last entrance used by the player and
// pick that specific entry by tracking something like:
// escapeExit: `${zone}:${entranceId}:${isSpiritWorld}`
// Then we can use that exact key for returning, and use a small map
// for things like pits to map to some reasonable alternative,
// or add the ability for entering a zone from a pit.
export const zoneEntranceMap = {
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
    'forestTemple': 'overworld:forestTempleLadder1',
    'waterfallTower': 'overworld:waterfallTowerEntrance',
     // waterfallTowerTopEntrance
    'forge': 'sky:forgeEntrance',
    'grandTemple': 'overworld:templeDoor',
    'jadePalace': 'overworld:jadePalaceEntrance',
    'skyPalace': 'sky:skyPalaceEntrance',
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
    if (enterZoneByTarget(state, zoneKey, markerId, null, true)) {
        fallIntoLocation(state);
    }
    return '';
}
function fallIntoLocation(state: GameState) {
    state.hero.action = 'knocked';
    state.hero.animationTime = 0;
    state.hero.z = CANVAS_HEIGHT;
    state.hero.vx = state.hero.vy = 0;
    state.hero.vz = -1;
    state.hero.safeD = state.hero.d;
    state.hero.safeX = state.hero.x;
    state.hero.safeY = state.hero.y;
}

dialogueHash.nimbusCloud = {
    key: 'nimbusCloud',
    mappedOptions: {
        returnMenu: `{choice:Return?|No:nimbusCloud.no|Home:nimbusCloud.returnToHome|Last Save:nimbusCloud.returnToLastSave}`,
        returnToHome: (state: GameState) => travelToLocation(state, 'overworld', 'waterfallMarker'),
        returnToLastSave: (state: GameState) => {
            returnToSpawnLocation(state);
            fallIntoLocation(state);
            return '';
        },
        chooseDestination: (state: GameState) => {
            if (zoneEntranceMap[state.location.logicalZoneKey]) {
                return `
                {choice:Return to entrance?|Yes:nimbusCloud.returnToEntrance|No:nimbusCloud.no}`;
            }
            if (state.location.isSpiritWorld) {
                return `{choice:Where to?
                        |Shop:nimbusCloud.spiritShop
                        |Temple:nimbusCloud.forestTemple
                        |Sky:nimbusCloud.skyCity
                        |City:nimbusCloud.jadeCity
                        |Nevermind:nimbusCloud.no
                        }`;
            }
            if (!state.location.isSpiritWorld && state.zone.surfaceKey) {
                return `The Nimbus Cloud won't appear underwater.`;
            }
            return `{choice:Where to?
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
            enterZoneByTarget(state, zoneKey, rest.join(':'), null, false);
            return '';
        },
        // Material world destinations
        lake: (state: GameState) => travelToLocation(state, 'overworld', 'lakeMarker'),
        holyCity: (state: GameState) => travelToLocation(state, 'overworld', 'holyCityMarker'),
        vanaraVillage: (state: GameState) => travelToLocation(state, 'overworld', 'vanaraVillageMarker'),
        crater: (state: GameState) => travelToLocation(state, 'sky', 'craterMarker'),
        summonerRuins: (state: GameState) => travelToLocation(state, 'overworld', 'summonerRuinsMarker'),
        // Spirit world destinations
        spiritShop: (state: GameState) => travelToLocation(state, 'overworld', 'spiritShopMarker'),
        forestTemple: (state: GameState) => travelToLocation(state, 'overworld', 'forestTempleMarker'),
        skyCity: (state: GameState) => travelToLocation(state, 'sky', 'skyCityMarker'),
        jadeCity: (state: GameState) => travelToLocation(state, 'overworld', 'jadeCityMarker'),
        no: '',
    },
    options: [],
};
