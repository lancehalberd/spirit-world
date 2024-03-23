
interface EnemyGroup {
    types: EnemyType[]
    // Defaults to 1
    difficulty?: number
    // Counts of how much this group has been used in the current zone/room/slot
    // Each context that uses this will reset these values, but this should be fine
    // since we do not generate these in parallel
    zoneCount?: number
    roomCount?: number
    slotCount?: number
    // Optional limits that can be applied to different scopes for this enemy group
    zoneLimit?: number
    roomLimit?: number
    slotLimit?: number

}

/*
EnemyPool:
    2 of [Snake 1, Beetle 1, FlyingBeetle 2, TinyBeetle 0]
    2 of [ChargingBeetle 3, golemHand 3, ArrowTurret 3]
    1 of [miniGolem 5]
 */

// Adds the enemy group to a slot
export function addEnemyGroupToSlot(slot: RoomSlot, groups: EnemyGroup, maxDifficulty?: number) {
    //const cx = (slot.x + slot.w / 2) * 16;
    //const cy = (slot.y + slot.h / 2) * 16;
}
