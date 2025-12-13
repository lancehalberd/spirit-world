import { zones } from 'app/content/zones/zoneHash';
import { isRandomizer } from 'app/gameConstants';
import { isCheckTrash } from 'app/randomizer/checks';
import { findReachableChecksFromStart } from 'app/randomizer/find';
import { setScript } from 'app/scriptEvents';
import { findObjectLocation } from 'app/utils/enterZoneByTarget';
import Random from 'app/utils/Random';

type ObjectZoneLocation = ZoneLocation & { object?: ObjectDefinition };

interface Mission {
    getMarkerLocation?: (state :GameState) => ObjectZoneLocation | false
    markerFrame?: Frame
    getScript: (state: GameState) => string
    isAvailable: (state: GameState) => boolean
    isResolved: (state: GameState) => boolean
}

function findMaterialWorldObject(state: GameState, objectIds: string | string[]) {
    return findObjectLocation(state, 'overworld', objectIds, false, null, true);
}
function findMaterialForestObject(state: GameState, objectIds: string | string[]) {
    return findObjectLocation(state, 'forest', objectIds, false, null, true);
}
function findSpiritWorldObject(state: GameState, objectIds: string | string[]) {
    return findObjectLocation(state, 'overworld', objectIds, true, null, true);
}
function findMaterialSkyObject(state: GameState, objectIds: string | string[]) {
    return findObjectLocation(state, 'sky', objectIds, false, null, true);
}
function findSpiritSkyObject(state: GameState, objectIds: string | string[]) {
    return findObjectLocation(state, 'sky', objectIds, true, null, true);
}

const getPeachCaveLocation = (state: GameState) => findMaterialWorldObject(state, 'peachCaveTopEntrance');
const getWaterfallVillageLocation = (state: GameState) => findMaterialWorldObject(state, 'waterfallCaveEntrance');
const getVanaraVillageLocation = (state: GameState) => {
    if (state.location.zoneKey === 'forest') {
        return findMaterialForestObject(state, 'vanaraVillageMarker');
    } else {
        return findMaterialWorldObject(state, 'forestMarkerM')
    }
}
const getVanaraElderLocation = (state: GameState) => {
    if (state.location.zoneKey === 'forest') {
        return findMaterialForestObject(state, 'elderEntrance');
    } else {
        return findMaterialWorldObject(state, 'forestMarkerM')
    }
}

const getTombLocation = (state: GameState) => findMaterialWorldObject(state, 'tombEntrance');
const getWarTempleLocation = (state: GameState) => findMaterialWorldObject(state, 'warTempleEntrance');
const getLakeTeleporterLocation = (state: GameState) => findMaterialWorldObject(state, ['tombTeleporter', 'lakeDreamTeleporter']);

const getLakeTunnelLocation = (state: GameState) => findMaterialWorldObject(state, 'lakeTunnelEntrance');
const getGrandTempleLocation = (state: GameState) => findMaterialWorldObject(state, 'grandTempleEntrance');

const getForestTempleLocation = (state: GameState) => findSpiritWorldObject(state, 'fertilityTempleSpiritEntrance');
const getWaterfallTowerLocation = (state: GameState) => findMaterialWorldObject(state, 'waterfallTowerEntrance');
const getForgeLocation = (state: GameState) => findSpiritSkyObject(state, 'forgeEntrance');
const getSkyPalaceLocation = (state: GameState) => findSpiritSkyObject(state, 'skyPalaceEntrance');
const getJadePalaceLocation = (state: GameState) => findSpiritWorldObject(state, 'jadePalaceEntrance');

const getCraterLocation = (state: GameState) => findMaterialSkyObject(state, 'craterEntrance');
const getLakeTempleLocation = (state: GameState) => findMaterialWorldObject(state, 'riverTempleUpperEntrance');
const getStaffTowerLocation = (state: GameState) => {
    const location = findMaterialWorldObject(state, 'staffTowerEntrance');
    if (!location) {
        return false;
    }
    // The location is for the tower, but we want to show the hint over the door of the tower.
    return {
        ...location,
        x: location.x + 80,
        y: location.y + 160,
    };
};

const getWarPalaceLocation = (state: GameState) => findSpiritWorldObject(state, 'warTempleEntranceSpirit');

const missions: Mission[] = [
    {
        getMarkerLocation: getPeachCaveLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey !== 'peachCave') {
                return `I want to explore that cave I fell in more.
                    {|}The entrance was just east of the waterfall north of the lake.`;
            } else {
                return 'I need to find a way out of this cave.';
            }
        },
        isAvailable(state: GameState) {
            return true;
        },
        isResolved(state: GameState) {
            return state.hero.savedData.weapon > 0;
        },
    },
    {
        getMarkerLocation: getPeachCaveLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey !== 'peachCave') {
                return `I wonder if that glowing peach is still in that cave?
                    {|}The entrance was just east of the waterfall and north of the lake.`;
            } else if (!state.savedState.objectFlags.peachCaveTree) {
                return 'With this Chakram I should be able to climb out of this cave.';
            } else {
                return 'I left that glowing peach somewhere in this cave.';
            }
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.weapon > 0;
        },
        isResolved(state: GameState) {
            return state.hero.savedData.passiveTools.catEyes > 0;
        },
    },
    {
        getMarkerLocation: getPeachCaveLocation,
        getScript(state: GameState) {
            return `Now that I can see in the dark I should have no trouble finding a way out of this cave.`;
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.passiveTools.catEyes > 0;
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.homeInstructions || state.location.zoneKey !== 'peachCave';
        },
    },
    {
        getMarkerLocation: getWaterfallVillageLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey !== 'waterfallCave') {
                return `I've been out for a long time, maybe I should head home to the cave behind the waterfall.
                    {|}The waterfall is just north of the lake.
                    {|}On the other hand, maybe I should go to the forest to warn the Vanara about what that mysterious tree told me?
                    {addCue: Press [B_MAP] to view the map}`;
            } else {
                return `I should tell my mom about what happened in the cave.
                    {|}I think I saw her by the pool at the entrance.`;
            }
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.passiveTools.catEyes > 0
                &&(!!state.savedState.objectFlags.homeInstructions || state.location.zoneKey !== 'peachCave');
        },
        isResolved(state: GameState) {
            // This is normally resolved by talking to your mom, but it is also considered resolved
            // if you talk to the Vanara Elder or Vanara Guardian first.
            return !!state.savedState.objectFlags.momElder
                || !!state.savedState.objectFlags.elderTomb
                || state.hero.savedData.passiveTools.spiritSight > 0;
        },
    },
    {
        getMarkerLocation: getVanaraVillageLocation,
        getScript(state: GameState) {
            return `I should ask around the Forest Village about that tree.`;
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.passiveTools.catEyes > 0
                && (!!state.savedState.objectFlags.homeInstructions || state.location.zoneKey !== 'peachCave');
        },
        isResolved(state: GameState) {
            // This is normally resolved by talking to your mom, but it is also considered resolved
            // if you talk to the Vanara Elder or Vanara Guardian first.
            return !!state.savedState.objectFlags.momElder
                || !!state.savedState.objectFlags.elderTomb
                || state.hero.savedData.passiveTools.spiritSight > 0;
        },
    },
    {
        getMarkerLocation: getVanaraElderLocation,
        getScript(state: GameState) {
            return `I should talk to the Vanara Elder about that tree and my strange powers.
                {|}He lives in the woods to the southwest with the other Vanara.
                {addCue: Press [B_MAP] to view the map}`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.momElder;
        },
        isResolved(state: GameState) {
            // Talking to the Vanara Guardian will also resolve this mission.
            return !!state.savedState.objectFlags.elderTomb
                || state.hero.savedData.passiveTools.spiritSight > 0;
        },
    },
    {
        getMarkerLocation: getVanaraElderLocation,
        getScript(state: GameState) {
            return `The Vanara Elder said there was something I needed in his basement.
                {|}He lives in the southwest tree in the forest.
                {addCue: Press [B_MAP] to view the map}`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elderTomb;
        },
        isResolved(state: GameState) {
            // Talking to the Vanara Guardian will also resolve this mission.
            return state.hero.savedData.activeTools.bow > 0
                || state.hero.savedData.passiveTools.spiritSight > 0;
        },
    },
    {
        getMarkerLocation: getTombLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey !== 'tomb') {
                return `The elder said I could learn more about my powers if I explore the Vanara Tomb.
                    {|}The Tomb is North of the woods in the Southwest.`;
            } else {
                return `The elder said I could learn more about my powers if I explore this Tomb.`;
            }
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elderTomb;
        },
        isResolved(state: GameState) {
            return state.hero.savedData.passiveTools.spiritSight > 0;
        },
    },
    {
        getMarkerLocation: getWaterfallVillageLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey !== 'waterfallCave') {
                return `I should go ask my mom if she knows anything about what the Vanara Guardian
                    was talking about.
                    {|}He said she might help me find a way to "touch the spirit world".
                    {addCue: Press [B_MAP] to view the map}`;
            } else {
                return `I think I saw my mom by the pool near the entrance.`;
            }
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.passiveTools.spiritSight > 0;
        },
        isResolved(state: GameState) {
            // This will automatically resolve if the player obtains the Summoner's Circlet even if they
            // never talk to their mom about the ruins.
            return !!state.savedState.objectFlags.momRuins
                || state.hero.savedData.passiveTools.astralProjection > 0;
        },
    },
    {
        getMarkerLocation: getWarTempleLocation,
        getScript(state: GameState) {
            return `There must be some way to open the Temple in the southeastern ruins.
                {|}Maybe my new spirit sight will show the way.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.momRuins;
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.warTempleEntrance;
        },
    },
    {
        getMarkerLocation: getWarTempleLocation,
        getScript(state: GameState) {
            return `I need to keep exploring the southeast ruins to find the treasure of the summoner tribe.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.momRuins && !!state.savedState.objectFlags.warTempleEntrance;
        },
        isResolved(state: GameState) {
            return !!state.hero.savedData.passiveTools.astralProjection;
        },
    },
    {
        getMarkerLocation: getLakeTeleporterLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey !== 'tomb') {
                return `The Guardian of the Tomb said to come back when I could "touch the spirit world".
                    {|}There was a teleporter by the lake that will take me back to the Tomb.`;
            } else {
                return `I should ask the Guardian what to do next.`;
            }
        },
        isAvailable(state: GameState) {
            return !!state.hero.savedData.passiveTools.astralProjection;
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.tombExit;
        },
    },
    {
        getMarkerLocation: getLakeTeleporterLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey === 'cocoon') {
                return `There must be something important at the bottom of this strange cave.`;
            } else if (state.location.zoneKey === 'tomb') {
                return `There must be something important in that strange cave behind this Tomb.`;
            } else {
                return `There must be something important in that strange cave behind the Tomb.
                    {|}There was a teleporter by the lake that will take me back to the Tomb.`;
            }
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.tombExit;
        },
        isResolved(state: GameState) {
            return !!state.hero.savedData.passiveTools.teleportation;
        },
    },
    {
        getMarkerLocation: getLakeTunnelLocation,
        getScript(state: GameState) {
            if (state.location.zoneKey === 'helix') {
                return `The Spirit Tree said I should seek answers at the top of this Helix.`;
            } else if (state.location.zoneKey === 'lakeTunnel') {
                return `The Spirit Tree said there is a trial awaiting me beyond this tunnel.`;
            } else {
                return `The Spirit Tree asked me to challenge the Trial of the Helix beyond the Lake Tunnel.
                    {|}My spirit abilities should be powerful enough to get through now.`;
            }
        },
        isAvailable(state: GameState) {
            return !!state.hero.savedData.passiveTools.teleportation;
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.vanaraCommanderBeasts;
        },
    },
    {
        getMarkerLocation(state: GameState) {
            if (state.location.isSpiritWorld) {
                return getJadePalaceLocation(state);
            } else {
                return getGrandTempleLocation(state);
            }
        },
        getScript(state: GameState) {
            if (state.location.isSpiritWorld) {
                if (state.location.zoneKey === 'grandTemple') {
                    return `The Spirit King should be in the throne room at the north end of the palace.`;
                } else {
                    return `I should head to the Jade Palace and talk to the Spirit King.`;
                }
            } else {
                return `There is a portal to the spirit world in the middle of the Grand Temple, north of the Holy City.
                    {|}If I travel through the portal I should be able to speak to the Spirit King on the other side.`;
            }
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.vanaraCommanderBeasts && !state.savedState.objectFlags.spiritKingForestTemple;
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.spiritKingForestTemple;
        },
    },
    {
        getMarkerLocation(state: GameState) {
            if (state.location.isSpiritWorld) {
                return getForestTempleLocation(state);
            } else {
                return getGrandTempleLocation(state);
            }
        },
        getScript(state: GameState) {
            if (state.location.isSpiritWorld) {
                return `The Spirit King said I would find something useful in the Fertility Temple.
                    {|}It is in the strange forest to the Southwest.`;
            } else {
                return `There is a portal to the spirit world in the middle of the Grand Temple, north of the Holy City.`;
            }
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.spiritKingForestTemple;
        },
        isResolved(state: GameState) {
            return !!state.hero.savedData.activeTools.clone && !!state.hero.savedData.equipment.cloudBoots;
        },
    },
    {
        getMarkerLocation: getGrandTempleLocation,
        getScript(state: GameState) {
            return `I might find something useful in the training gauntlet under the Grand Temple.
                {|}There is a staircase to the Gauntlet at the back of the temple.`;
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elementalBeastsEscaped
                && !!state.hero.savedData.activeTools.staff
                && !!state.hero.savedData.activeTools.clone && !!state.hero.savedData.equipment.cloudBoots;
        },
        isResolved(state: GameState) {
            return !!state.hero.savedData.passiveTools.trueSight;
        },
    },
    {
        getMarkerLocation: getWaterfallTowerLocation,
        getScript(state: GameState) {
            return `There is something hidden behind the waterfall at the top of the mountain.`;
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elementalBeastsEscaped
                && !!state.hero.savedData.passiveTools.trueSight;
        },
        isResolved(state: GameState) {
            return !!(state.hero.savedData.activeTools.cloak & 2);
        },
    },
    {
        getMarkerLocation: getForgeLocation,
        getScript(state: GameState) {
            return `There is a Forge at the top of the mountains in the Spirit World.
                {|}I can probably upgrade my equipment there.`;
        },
        isAvailable(state: GameState) {
            // Never show this hint before the beasts have escaped.
            if (!state.savedState.objectFlags.elementalBeastsEscaped) {
                return false;
            }
            return (
                // The forge is easily reached by moving the Staff Tower to the mountain area.
                state.hero.savedData.elements.lightning >= 1
                // Otherwise we only give this hint if they have completed Waterfall Tower to reach the sky.
                || (state.hero.savedData.activeTools.cloak >= 2
                    && (
                        // Freezing brittle tiles in the sky allows reaching the Forge area.
                        state.hero.savedData.elements.ice >= 1
                        // The Cloud Sommersault allows the player to move freely through the sky.
                        || state.hero.savedData.passiveTools.roll >= 2
                    )
                )
            );
        },
        isResolved(state: GameState) {
            return !!state.hero.savedData.passiveTools.goldMail;
        },
    },
    {
        getMarkerLocation: getSkyPalaceLocation,
        getScript(state: GameState) {
            return `There is a useful treasure hidden in the Sky Palace, but I'll have to figure out how to get in.`;
        },
        isAvailable(state: GameState) {
            // Never show this hint before the beasts have escaped.
            if (!state.savedState.objectFlags.elementalBeastsEscaped) {
                return false;
            }
            // It is possible to reach and complete Sky Palace just using Clone, but we still don't give
            // the hint in this case.
            // Assume the player can reach the sky if they have completed Waterfall Tower or Staff Tower.
            return (state.hero.savedData.activeTools.cloak >= 2 || state.hero.savedData.elements.lightning >= 1)
                // The player will need cloud boots or ice to navigate the brittle floor in the sky.
                && (state.hero.savedData.equipment.cloudBoots >= 1 || state.hero.savedData.elements.ice >= 1)
                && (
                    // Any of these items can be used to get past the lightning barriers.
                    state.hero.savedData.passiveTools.lightningBlessing >= 1
                    || state.hero.savedData.activeTools.cloak >= 2
                    || state.hero.savedData.elements.lightning >= 1
                    // The upgraded gloves allow entering through a secret passage.
                    || state.hero.savedData.passiveTools.gloves >= 2
                );
        },
        isResolved(state: GameState) {
            return !!state.hero.savedData.passiveTools.nimbusCloud;
        },
    },
    {
        getMarkerLocation: getJadePalaceLocation,
        getScript(state: GameState) {
            return `There is a powerful relic hidden in the Holy Sanctum.
                {|}There is a door to the Sanctum at the back of the Jade Palace in the Spirit World.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elementalBeastsEscaped
                && (
                    state.hero.savedData.elements.lightning >= 1
                    || (state.hero.savedData.elements.ice >= 1 && state.hero.savedData.passiveTools.waterBlessing >= 1)
                    || (state.hero.savedData.elements.fire >= 1 && state.hero.savedData.passiveTools.fireBlessing >= 1)
                );
        },
        isResolved(state: GameState) {
            return !!(state.hero.savedData.activeTools.bow & 2);
        },
    },
    {
        getMarkerLocation: getCraterLocation,
        getScript(state: GameState) {
            return `The Flame Beast is probably in the crater among the mountain peaks.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elementalBeastsEscaped
                && (
                    state.hero.savedData.equipment.cloudBoots >= 1
                    || state.hero.savedData.elements.ice >= 1
                    || state.hero.savedData.activeTools.cloak >= 2
                    || state.hero.savedData.passiveTools.gloves >= 2
                );
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.flameBeast;
        },
    },
    {
        getMarkerLocation: getLakeTempleLocation,
        getScript(state: GameState) {
            return `The Frost Beast must be residing in the ruins in the middle of the Frozen Lake.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elementalBeastsEscaped
                && (
                    state.hero.savedData.equipment.ironBoots >= 1
                    || (
                        (state.hero.savedData.elements.lightning >= 1 || state.hero.savedData.elements.fire >= 1)
                        && (state.hero.savedData.activeTools.clone >= 1 || state.hero.savedData.passiveTools.nimbusCloud >= 1)
                    )
                );
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.frostBeast;
        },
    },
    {
        getMarkerLocation: getStaffTowerLocation,
        getScript(state: GameState) {
            return `The Storm Beast is roosting at the top of the Staff Tower.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.elementalBeastsEscaped
                && (
                    state.hero.savedData.equipment.cloudBoots >= 1
                    || state.hero.savedData.elements.ice >= 1
                    || state.hero.savedData.activeTools.cloak >= 2
                    || state.hero.savedData.activeTools.clone >= 1
                );
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.stormBeast;
        },
    },
    {
        getMarkerLocation: getJadePalaceLocation,
        getScript(state: GameState) {
            return `There is another powerful relic hidden in the Holy Sanctum.
                {|}There is a door to the Sanctum at the back of the Jade Palace in the Spirit World.`
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.activeTools.bow >= 2
                && state.hero.savedData.elements.lightning >= 1
                && state.hero.savedData.elements.ice >= 1
                && state.hero.savedData.elements.fire >= 1 && state.hero.savedData.passiveTools.fireBlessing >= 1;
        },
        isResolved(state: GameState) {
            return state.hero.savedData.passiveTools.phoenixCrown >= 1;
        },
    },
    {
        getMarkerLocation: getWarPalaceLocation,
        getScript(state: GameState) {
            return `Something evil is growing under the War Palace.
                {|}The War Palace is to the southeast in the Spirit World.`
        },
        isAvailable(state: GameState) {
            return state.hero.savedData.elements.lightning >= 1
                && state.hero.savedData.elements.ice >= 1
                && state.hero.savedData.elements.fire >= 1;
        },
        isResolved(state: GameState) {
            return !!state.savedState.objectFlags.voidTree;
        },
    },
    {
        getMarkerLocation: getWarPalaceLocation,
        getScript(state: GameState) {
            return `Something evil is growing under the War Palace.
                {|}The War Palace is to the southeast in the Spirit World.`
        },
        isAvailable(state: GameState) {
            return !!state.savedState.objectFlags.voidTree;
        },
        isResolved(state: GameState) {
            return false;
        },
    },
];


export function showHint(state: GameState): void {
    // Don't show hints while an active script is running.
    // In particular, don't show hints when a respawn hint is showing, which has higher priority than mission hints.
    if (state.scriptEvents.activeEvents.length || state.scriptEvents.queue.length) {
        return;
    }
    if (isRandomizer) {
        setScript(state, getRandomizerHint(state));
        return;
    }
    for (const mission of missions) {
        if (mission.isAvailable(state) && !mission.isResolved(state)) {
            setScript(state, mission.getScript(state));
            return;
        }
    }
    const flags = state.savedState.objectFlags;
    if (!flags.voidTree) {
        setScript(state, ``);
    } else {
        setScript(state, `Isn't there anywhere else interesting to go?
            {|}Try adding ?seed=20 to the url to play the randomizer.`);
    }
}

export function getMapTargets(state: GameState): ObjectZoneLocation[] {
    if (isRandomizer) {
        return [];
    }
    const locations: ObjectZoneLocation[] = [];
    for (const mission of missions) {
        if (mission.isAvailable(state) && !mission.isResolved(state)) {
            const location = mission.getMarkerLocation(state);
            if (location) {
                locations.push(location);
            }
        }
    }
    return locations;
}

export function convertLocationToMapCoordinates(location: ZoneLocation & {object?: ObjectDefinition}): {x: number, y: number} {
    const zone = zones[location.zoneKey];
    const {w, h} = zone.areaSize ?? {w: 32, h: 32};
    const pixel = {
        x: location.areaGridCoords.x * w * 16 + location.x,
        y: location.areaGridCoords.y * h * 16 + location.y,
    }
    const coords = {
        x: pixel.x * 4 / w,
        y: pixel.y * 4 / h,
    };
    // Most doors are 32x32, so add 16 / 2 px to the coords to target the center of the door
    if (location.object?.type === 'door') {
        coords.x += 2;
        coords.y += 2;
    } else {
        // Other objects like teleporters/pits tend to be 16x16
        coords.x++;
        coords.y++;
    }
    return coords;
}


export function getRandomizerZoneDescription(zone: LogicalZoneKey): string {
    switch (zone) {
        case 'sky': return 'in the sky';
        case 'spiritSky': return 'in the spirit world sky';
        case 'overworld': return 'outside';
        case 'spiritWorld': return 'out in the spirit world';
        case 'bushCave': return 'in a cave full of bushes';
        case 'frozenCave': return  'in a frozen cave';
        case 'lakeTunnel': return 'in the tunnel by the lake';
        case 'ascentCave': return  'in a cave on the mountain';
        case 'ascentCaveSpirit': return  'in the spirit world in a cave on the mountain';
        case 'cloneCave': return  'in a cave in the spirit world';
        case 'treeCave': return  'in a cave under a tree';
        case 'bellCave': return  'in a cave in the spirit world';
        case 'hypeCave': return  'in a cave in the sky of the spirit world';
        case 'fertilityShrine': return 'in the shrine by the forest village';
        case 'fertilityShrineSpirit': return 'in the shrine by the Fertility Temple';
        case 'holyCityInterior': return 'inside the Holy City';
        case 'jadeCityInterior': return 'inside the Jade City';
        case 'waterfallCave': return 'in the Cave Village';
        case 'treeVillage': return 'in the Vanara Village';
        case 'peachCave': return 'in the dark cave by the lake';
        case 'peachCaveSpirit': return 'in a cave in the spirit world';
        case 'tomb': return 'in the Vanara Tomb';
        case 'warTemple': return 'in the Summoner Ruins';
        case 'cocoon': return 'in the Cocoon behind the Vanara Tomb';
        case 'helix': return 'in the Helix';
        case 'forestTemple': return 'in the Fertility Temple';
        case 'waterfallTower': return 'in the Waterfall Tower';
        case 'forge': return 'in the Forge';
        case 'grandTemple': return 'in the Grand Temple';
        case 'skyPalace': return 'in the Sky Palace';
        case 'jadePalace': return 'in the Jade Palace';
        case 'riverTemple': return 'in the Lake Ruins';
        case 'crater': return 'in the Volcano Crater';
        case 'staffTower': return 'in the Staff Tower';
        case 'warPalaceWestRoom': 'near the Palace of War';
        case 'warPalace': return 'in the Palace of War';
        case 'lab': return 'in the Hidden Laboratory';
        case 'treeSpirit': return 'in the World Tree';
        case 'tree': return 'in the World Tree';
        case 'void': return 'in the abyss of space';
        case 'gauntlet': return 'in the Gauntlet under the Grand Temple';
        case 'holySanctum': return 'in the Holy Sanctum of the Jade Palace';
        case 'forest': return 'in the Forest';
        case 'spiritForest': return 'in the Spirit Forest';
        case 'dream': return 'in the Dreaming';
    }
    // The type of this should just be `void` if all zones are handled.
    return zone;
}

export function getRandomizerHint(state: GameState): string {
    const reachableChecks: LootWithLocation[] = findReachableChecksFromStart(state);
    for (const check of Random.shuffle(reachableChecks)) {
        // Example debug code for finding source of bad check in Staff Tower.
        // Ignore all hints for checks outside of staff tower and log any that are in logic.
        /*if (check.location?.logicalZoneKey !== 'staffTower') {
            continue;
        } else {
            console.log(check);
        }*/
        // Don't suggest checks that we know aren't useful.
        if (isCheckTrash(state, check)){
            continue;
        }
        if (check.location) {
            const logicalZoneKey = check.location.logicalZoneKey;
            if (check.lootObject.type === 'dialogueLoot') {
                const npcKey = `${check.location.zoneKey}-${check.lootObject.id}`;
                if (state.savedState.objectFlags[npcKey]) {
                    continue;
                }
                return `Try talking to someone ${getRandomizerZoneDescription(logicalZoneKey)}.`;
            }
            if (state.savedState.objectFlags[check.lootObject.id]) {
                continue;
            }
            // console.log(check.location.logicalZoneKey, check.lootObject.id);
            return `There is still something ${getRandomizerZoneDescription(logicalZoneKey)}.`;
        } else {
            const {dialogueKey, optionKey} = check;
            const flag = `${dialogueKey}-${optionKey}`;
            if (state.savedState.objectFlags[flag]) {
                continue;
            }
            if (dialogueKey === 'streetVendor') {
                return `The merchant has something for sale.`;
            }
            if (dialogueKey === 'storageVanara') {
                return `A vanara would be grateful for an exterminator.`;
            }
            if (dialogueKey === 'citySmith') {
                return `The City Smith will give you something after upgrading your Chakram.`;
            }
            if (dialogueKey === 'forgeSmith') {
                return `The Forge Smith will give you something after upgrading your Chakram.`;
            }
            return `Try talking to someone called ${dialogueKey}.`;
        }
    }
    return 'Looks like BK Mode to me :)';
}
