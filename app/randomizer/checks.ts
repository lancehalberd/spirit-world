

const allChecks = new Set<string>();
const lootAssignmentByKey: {[key: string]: LootAssignment} = {};
const checksByZone: {[key: string]: Set<string>} = {};
const dungeonItemCountByZone: {[key: string]: number} = {};
const logicalZoneKeyByCheckKey: {[key: string]: LogicalZoneKey} = {};
window['allChecks'] = allChecks;
window['checksByZone'] = checksByZone;

export function getCheckInfo(state: GameState, logicalZoneKey = state.location.logicalZoneKey) {
    let checksCompleted = 0;
    let zoneChecksCompleted = 0;
    for (const key of allChecks.keys()) {
        if (state.savedState.objectFlags[key]) {
            checksCompleted++;
        }
    }
    const zoneChecks = checksByZone[logicalZoneKey] || new Set<string>();
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

const trashLoot: LootType[] = [
    'map', 'empty', 'money', 'peach',
    // Technically these can be progress because the first full piece grants cat eyes, but since this
    // definition is only for the hint system, it is okay to just rely on the player for remembering these.
    'peachOfImmortalityPiece', 'peachOfImmortality',
];
const dungeonLoot: LootType[] = [
    'smallKey', 'bigKey', 'map'
];

export function isCheckTrash(state: GameState, check: LootWithLocation): boolean {
    try {
        // Peeked items are trash
        if (state.savedState.objectFlags[check.lootObject.id + '-peeked']) {
            if (trashLoot.includes(check.lootObject.lootType)) {
                return true;
            }
        }
        let checkFlag: string;
        // For now assume we can't figure anything out about checks without locations like dialogue checks.
        if (check.location) {
            if (check.lootObject.type === 'dialogueLoot') {
                checkFlag = `${check.location.zoneKey}-${check.lootObject.id}`;
            } else {
                checkFlag = check.lootObject.id;
            }
        } else {
            const {dialogueKey, optionKey} = check;
            checkFlag = `${dialogueKey}-${optionKey}`;
        }
        const logicalZoneKey = logicalZoneKeyByCheckKey[checkFlag];
        // Dungeon items are trash even if they aren't peeked if we know there are no non-dungeon items left
        // to get.
        if (dungeonLoot.includes(check.lootObject.lootType)) {
            const dungeonInventory = state.savedState.dungeonInventories[logicalZoneKey];
            // Exception: Big key is required to reach the Cocoon from the Tomb.
            if (logicalZoneKey === 'tomb' && !dungeonInventory?.bigKey) {
                return false;
            }
            // Exception: Crater/Staff Tower/River Temple defeating the bosses unlocks progress
            if (logicalZoneKey === 'crater' && dungeonInventory?.map) {
                // The map is the only trash dungeon item in the crater since all keys are logically necessary to beat the boss.
                return false;
            }
            // Small keys may be required for reaching the exit or the boss. There is no Big Key in this dungeon.
            if (logicalZoneKey === 'staffTower' && dungeonInventory?.map) {
                return false;
            }
            if (logicalZoneKey === 'riverTemple' && !dungeonInventory?.bigKey) {
                // The big key is the only required dungeon item to reach the boss.
                return false;
            }
            const zoneChecks = checksByZone[logicalZoneKey] || new Set<string>();
            // If we find any non-dungeon loot left in this zone, then any un-peeked checks might be good.
            for (const key of zoneChecks.keys()) {
                if (state.savedState.objectFlags[key]) {
                    continue;
                }
                const lootType = lootAssignmentByKey[key].lootType;
                if (state.savedState.objectFlags[key + '-peeked'] && trashLoot.includes(lootType)) {
                    continue;
                }
                if (!dungeonLoot.includes(lootType)) {
                    return false
                }
            }
            // If the only items left in this zone are dungeon loot, then consider all checks in this dungeon trash.
            // Note there are exceptions above for specific dungeons that might require keys or big keys for progress unrelated
            // to the checks themselves.
            return true;
        }
    } catch (error) {
        console.error(error);
        debugger;
    }

    return false;
}
window.isCheckTrash = isCheckTrash;

export function addCheck(checkId: string, assignment: LootAssignment, logicalZoneKey: LogicalZoneKey) {
    allChecks.add(checkId);
    checksByZone[logicalZoneKey] = checksByZone[logicalZoneKey] || new Set();
    checksByZone[logicalZoneKey].add(checkId);
    lootAssignmentByKey[checkId] = assignment;
    logicalZoneKeyByCheckKey[checkId] = logicalZoneKey;
    if (dungeonLoot.includes(assignment.lootType)) {
        dungeonItemCountByZone[logicalZoneKey] = (dungeonItemCountByZone[logicalZoneKey] || 0) + 1;
    }
}
