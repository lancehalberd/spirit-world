
import { GameState } from 'app/types';

const allChecks = new Set<string>();
const checksByZone: {[key: string]: Set<string>} = {};

export function getCheckInfo(state: GameState) {
    let checksCompleted = 0;
    let zoneChecksCompleted = 0;
    for (const key of allChecks.keys()) {
        if (state.savedState.objectFlags[key]) {
            checksCompleted++;
        }
    }
    const zoneChecks = checksByZone[state.location.zoneKey] || new Set<string>();
    for (const key of zoneChecks.keys()) {
        if (state.savedState.objectFlags[key]) {
            zoneChecksCompleted++;
        }
    }
    return {
        totalChecks: allChecks.size,
        checksCompleted,
        totalZoneChecks: zoneChecks.size,
        zoneChecksCompleted,
    };
}

export function addCheck(checkId: string, zoneKey: string) {
    allChecks.add(checkId);
    checksByZone[zoneKey] = checksByZone[zoneKey] || new Set();
    checksByZone[zoneKey].add(checkId);
}
