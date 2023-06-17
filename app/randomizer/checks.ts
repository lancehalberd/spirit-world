

const allChecks = new Set<string>();
const checksByZone: {[key: string]: Set<string>} = {};
window['allChecks'] = allChecks;
window['checksByZone'] = checksByZone;

export function getCheckInfo(state: GameState) {
    let checksCompleted = 0;
    let zoneChecksCompleted = 0;
    for (const key of allChecks.keys()) {
        if (state.savedState.objectFlags[key]) {
            checksCompleted++;
        }
    }
    const zoneChecks = checksByZone[state.location.logicalZoneKey] || new Set<string>();
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

export function addCheck(checkId: string, logicalZoneKey: LogicalZoneKey) {
    allChecks.add(checkId);
    checksByZone[logicalZoneKey] = checksByZone[logicalZoneKey] || new Set();
    checksByZone[logicalZoneKey].add(checkId);
}
