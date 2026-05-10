import {evaluateLogicDefinition} from 'app/content/logic';
import {zones} from 'app/content/zones';
import {overworldKeys} from 'app/gameConstants';
import {isPointInShortRect} from 'app/utils/index';

export function isLocationHot(state: GameState, location: ZoneLocation): boolean {
    const floor = zones[location.zoneKey]?.floors?.[location.floor];
    const grid = location.isSpiritWorld ? floor?.spiritGrid : floor?.grid;
    const areaDefinition = grid?.[location.areaGridCoords.y]?.[location.areaGridCoords.x];
    if (!areaDefinition) {
        console.warn('Could not find area definition for location: ', location);
        return false;
    }
    const x = Math.min(31, Math.max(0, (location.x + 8) / 16));
    const y = Math.min(31, Math.max(0, (location.y + 8) / 16));
    //console.log('is hot?', location, x, y);
    for (const section of areaDefinition.sections) {
        if (isPointInShortRect(x, y, section)) {
            if (section.hotLogic) {
                //console.log(section);
               // console.log('Hot Logic', section.hotLogic);
                return evaluateLogicDefinition(state, section.hotLogic, false);
            }
        }
    }
    return false;
}

export function isOverworldLocation(state: GameState) {
    return !!getOverworldMapId(state);
}
export function isOverworldZoneKey(zoneKey: string): zoneKey is OverworldZoneKeys {
    return overworldKeys.has(zoneKey as OverworldZoneKeys);
}

export function getOverworldMapId(state: GameState): OverworldMapZoneKey|undefined {
    for (const zoneKey of [state.location.zoneKey, state.areaSection?.definition?.mapId]) {
        if (isOverworldZoneKey(zoneKey)) {
            if (zoneKey === 'underwater') {
                return 'overworld';
            }
            if (zoneKey === 'forestWater') {
                return 'forest';
            }
            return zoneKey;
        }
    }
}
