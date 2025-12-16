import {getAreaFromLocation} from 'app/content/areas';
import {TextCue} from 'app/content/effects/textCue';
import {evaluateLogicDefinition} from 'app/content/logic';
import {Door} from 'app/content/objects/door';
import {DreamPod} from 'app/content/objects/dreamPod';
import {Teleporter} from 'app/content/objects/teleporter';
import {checkForFloorEffects} from 'app/movement/checkForFloorEffects';
import {zones} from 'app/content/zones';
import {updateAreaSection} from 'app/utils/area';
import {directionMap, getCardinalDirection} from 'app/utils/direction';
import {addEffectToArea} from 'app/utils/effects';
import {enterLocation} from 'app/utils/enterLocation';
import {findObjectInstanceById } from 'app/utils/findObjectInstanceById';
import {fixCamera} from 'app/utils/fixCamera';
import {checkToUpdateSpawnLocation} from 'app/content/spawnLocations';


interface OptionalEnterZoneByTargetParams {
    instant?: boolean
    callback?: (state: GameState) => void
    skipObject?: ObjectDefinition
    doNotFixCamera?: boolean
    transitionType?: 'circle'|'fade'
}

export function enterZoneByTarget(
    state: GameState,
    zoneKey: string,
    targetObjectId: string,
    {
        skipObject,
        instant = false,
        callback,
        transitionType
    }: OptionalEnterZoneByTargetParams = {}
): boolean {
    const zone = zones[zoneKey];
    if (!zone) {
        console.error(`Missing zone: ${zoneKey}`);
        return false;
    }
    const objectLocation = findObjectLocation(state, zoneKey, targetObjectId, state.areaInstance.definition.isSpiritWorld, skipObject, true);
    if (!objectLocation) {
        return false;
    }
    const targetAreaDefinition = getAreaFromLocation(objectLocation);
    if (state.areaInstance.definition === targetAreaDefinition) {
        onEnterLocation(state, targetObjectId, {doNotFixCamera: true, skipObject, callback});
        return true;
    }
    if (state.location.zoneKey !== objectLocation.zoneKey) {
        // When leaving a zone through a door, we check to update the spawn location for both the location you are leaving from or the
        // location you are arriving to. This will cause you to update your spawn location when entering or exiting most dungeons
        // to the interior of the dungeon you most recently entered or left, provided you used an entrance associated with a spawn point.
        checkToUpdateSpawnLocation(state);
        checkToUpdateSpawnLocation(state, objectLocation);
    }
    enterLocation(state, objectLocation, {
        instant,
        callback: () => onEnterLocation(state, targetObjectId, {skipObject, callback}),
        transitionType,
    });
    return true;
}

function onEnterLocation(
    state: GameState,
    targetObjectId: string,
    {
        skipObject,
        callback,
        doNotFixCamera,
    }: OptionalEnterZoneByTargetParams = {}
) {
    const target = findEntranceById(state, state.areaInstance, targetObjectId, [skipObject]);
    if (target?.getHitbox) {
        const hitbox = target.getHitbox(state);
        state.hero.x = hitbox.x + hitbox.w / 2 - state.hero.w / 2;
        state.hero.y = hitbox.y + hitbox.h / 2 - state.hero.h / 2;
        updateAreaSection(state, true);
        checkForFloorEffects(state, state.hero);
        if (!doNotFixCamera) {
            fixCamera(state);
        }
    }
    // Technically this could also be a MarkerDefinition.
    const definition = target.definition as EntranceDefinition|MarkerDefinition;
    if (definition.locationCue) {
        const textCue = new TextCue(state, { text: definition.locationCue});
        addEffectToArea(state, state.areaInstance, textCue);
    }
    // Entering via a door requires some special logic to orient the
    // character to the door properly.
    if (definition.type === 'door') {
        enterZoneByDoorCallback(state, targetObjectId, skipObject);
    } else if (definition.type === 'teleporter') {
        enterZoneByTeleporterCallback(state, targetObjectId);
    } else if (definition.type === 'marker') {
        state.hero.action = null;
    } else if (definition.type === 'dreamPod') {
        enterZoneByDreamPodCallback(state, targetObjectId);
    }
    callback?.(state);
}

export function findObjectLocation(
    state: GameState,
    zoneKey: string,
    targetObjectIds: string | string[],
    checkSpiritWorldFirst = false,
    skipObject: ObjectDefinition = null,
    showErrorIfMissing = false
): ZoneLocation & {object: ObjectDefinition} | false {
    const zone = zones[zoneKey];
    const objectIds = Array.isArray(targetObjectIds) ? targetObjectIds : [targetObjectIds];
    if (!zone) {
        debugger;
        console.error('Missing zone', zoneKey);
        return false;
    }
    for (let worldIndex = 0; worldIndex < 2; worldIndex++) {
        for (let floor = 0; floor < zone.floors.length; floor++) {
            // Search the corresponding spirit/material world before checking in the alternate world.
            const areaGrids = checkSpiritWorldFirst
                ? [zone.floors[floor].spiritGrid, zone.floors[floor].grid]
                : [zone.floors[floor].grid, zone.floors[floor].spiritGrid];
            const areaGrid = areaGrids[worldIndex];
            const inSpiritWorld = areaGrid === zone.floors[floor].spiritGrid;
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (objectIds.includes(object.id) && object !== skipObject) {
                            if (!evaluateLogicDefinition(state, object)) {
                                continue;
                            }
                            return {
                                zoneKey,
                                floor,
                                areaGridCoords: {x, y},
                                x: object.x,
                                y: object.y,
                                d: state.hero.d,
                                isSpiritWorld: inSpiritWorld,
                                object,
                            };
                        }
                    }
                }
            }
        }
    }
    if (showErrorIfMissing) {
        console.error('Could not find', targetObjectIds, 'in', zoneKey);
    }
    return false;
}

function enterZoneByDoorCallback(this: void, state: GameState, targetObjectId: string, skipObject: ObjectDefinition) {
    // We need to reassign hero after calling `enterZoneByTarget` because the active hero may change
    // from one clone to another when changing zones.
    const hero = state.hero;
    hero.isUsingDoor = true;
    hero.isExitingDoor = true;
    const target = findEntranceById(state, state.areaInstance, targetObjectId, [skipObject]) as Door;
    if (!target){
        console.error(state.areaInstance.objects);
        console.error(targetObjectId);
        debugger;
    }
    // When passing horizontally through narrow doors, we need to start 3px lower than usual.
    if (target.definition.type === 'door') {
        const hitbox = target.style.getHitbox(target);
        // When exiting new style doors, the MCs head appears above the frame, so start them lower.
        if (hitbox.w === 64 && target.definition.d === 'up') {
            hero.y += 6;
        }
        // This is for old 32x32 side doors.
        if (hitbox.h === 32 && target.definition.d !== 'down') {
            hero.y += 3;
        }
        // This is for new side doors.
        if (hitbox.h === 64 && (target.definition.d === 'left' || target.definition.d === 'right')) {
            hero.y += 8;
        }
        hero.renderParent = target;
    }
    hero.actionTarget = target;

    if (target.style.isLadderUp || target.style.isLadderDown) {
        hero.action = 'climbing';
    }
    // Make sure the hero is coming *out* of the target door.
    hero.actionDx = -directionMap[target.definition.d][0];
    hero.actionDy = -directionMap[target.definition.d][1];
    hero.vx = 0;
    hero.vy = 0;
    // If this isn't set to 0 the hero's sprite might peak over the top of door frames.
    hero.z = 0;
    // This will be the opposite direction of the door they are coming out of.
    hero.d = getCardinalDirection(hero.actionDx, hero.actionDy);
}

function enterZoneByTeleporterCallback(this: void, state: GameState, targetObjectId: string) {
    const hero = state.hero;
    hero.isUsingDoor = true;
    const target = findObjectInstanceById(state.areaInstance, targetObjectId) as Teleporter;
    if (!target){
        console.error(state.areaInstance.objects);
        console.error(targetObjectId);
        debugger;
    } else {
        target.disabledUntilHeroLeaves = true;
    }
    // Make sure the hero appears to be behind the teleporter glow.
    hero.y--;
}

function enterZoneByDreamPodCallback(this: void, state: GameState, targetObjectId: string) {
    const target = findObjectInstanceById(state.areaInstance, targetObjectId) as DreamPod;
    if (!target){
        console.error(state.areaInstance.objects);
        console.error(targetObjectId);
        debugger;
    } else {
        state.hero.d = 'down';
        delete state.hero.action;
        // Pods are always closed when we enter them from another location.
        target.isOpen = false;
        target.animationTime = target.getAnimation().duration;
        // This flag lets the pod track that the player is performing the "getting out" action.
        target.heroIsLeaving = true;
        // Pod will control and render the hero until this is unset.
        state.hero.renderParent = target;
        state.hero.isControlledByObject = true;
    }
}

function findEntranceById(state: GameState, areaInstance: AreaInstance, id: string, skippedDefinitions: ObjectDefinition[]): ObjectInstance {
    for (const object of areaInstance.objects) {
        if (!object.definition || skippedDefinitions?.includes(object.definition)) {
            continue;
        }
        if (object.definition.type !== 'enemy'
            && object.definition.type !== 'boss'
            && object.definition.id === id
        ) {
            // The "staffTower" and "helixTop" objects each have a door subcomponent
            // that should be targeted rather than the tower itself.
            if (object.definition.type === 'staffTower' || object.definition.type === 'helixTop') {
                return object.getParts(state).find(object => object.definition?.id === id);
            }
            return object;
        }
    }
    console.error('Missing target', id);
}
