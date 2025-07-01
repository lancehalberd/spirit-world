import {
    createAreaInstance, getAreaFromLocation, linkObjects, setConnectedAreas,
} from 'app/content/areas';
import { zones } from 'app/content/zones';
import { editingState } from 'app/development/editingState';
import { checkForFloorEffects } from 'app/movement/checkForFloorEffects';
import { removeTextCue } from 'app/content/effects/textCue';
import { cleanupHeroFromArea, setAreaSection } from 'app/utils/area'
import { checkIfAllEnemiesAreDefeated } from 'app/utils/checkIfAllEnemiesAreDefeated';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { fixCamera } from 'app/utils/fixCamera';
import { getFullZoneLocation } from 'app/utils/getFullZoneLocation';
import { removeObjectFromArea } from 'app/utils/objects';

interface OptionalEnterLocationParams {
    instant?: boolean
    callback?: () => void
    isMutation?: boolean
    doNotRefreshEditor?: boolean
    preserveZoneFlags?: boolean
}

export function enterLocation(
    state: GameState,
    location: ZoneLocation,
    {
        callback,
        instant = false,
        isMutation = false,
        doNotRefreshEditor = false,
        preserveZoneFlags = false,
    }: OptionalEnterLocationParams = {}
): void {
    // Remve astral projection when switching areas.
    if (state.hero.astralProjection) {
        removeObjectFromArea(state, state.hero.astralProjection);
        state.hero.astralProjection = null;
    }
    removeTextCue(state);
    if (state.hero.action === 'meditating') {
        state.hero.action = null;
    }
    state.hero.spiritRadius = 0;
    if (!instant) {
        state.transitionState = {
            callback,
            nextLocation: location,
            time: 0,
            type: 'fade',
        };
        if (state.underwaterAreaInstance && state.zone.underwaterKey === location.zoneKey) {
            state.transitionState.type = 'diving';
            state.transitionState.nextAreaInstance = state.underwaterAreaInstance;
            state.hero.vx = state.hero.vy = 0;
        } else if (state.zone.surfaceKey === location.zoneKey) {
            state.transitionState.type = 'surfacing';
            state.transitionState.nextAreaInstance = state.surfaceAreaInstance;
            state.hero.vx = state.hero.vy = 0;
        } else if (!!state.location.isSpiritWorld !== !!location.isSpiritWorld && state.location.zoneKey === location.zoneKey) {
            state.transitionState.type = 'portal';
        } else if (state.location.logicalZoneKey !== getFullZoneLocation(location).logicalZoneKey) {
            state.transitionState.type = 'circle';
        }
        const targetAreaDefinition = getAreaFromLocation(location);
        if (state.alternateAreaInstance.definition === targetAreaDefinition) {
            state.transitionState.nextAreaInstance = state.alternateAreaInstance;
            state.transitionState.nextAlternateAreaInstance = state.areaInstance;
            // Bring the held chakram with you.
            if (state.hero.heldChakram) {
                removeEffectFromArea(state, state.hero.heldChakram);
                addEffectToArea(state, state.transitionState.nextAreaInstance, state.hero.heldChakram);
            }
            if (state.hero.activeBarrierBurst) {
                // console.log('transferring barrier burst to new area');
                removeEffectFromArea(state, state.hero.activeBarrierBurst);
                addEffectToArea(state, state.transitionState.nextAreaInstance, state.hero.activeBarrierBurst);
            }
        }
        return;
    }
    // Clear zone flags when changing zones.
    if (!preserveZoneFlags && state.location.logicalZoneKey !== getFullZoneLocation(location).logicalZoneKey) {
        state.savedState.zoneFlags = {};
    }
    state.location = getFullZoneLocation({
        ...location,
        areaGridCoords: {...location.areaGridCoords},
        z: 0,
    });
    state.zone = zones[location.zoneKey];
    state.hero.x = location.x;
    state.hero.y = location.y;
    state.hero.endInvisibility(state);
    // If the player somehow enters the staff tower while the tower staff is equipped (such as returning to last save)
    // Remove the tower staff from their inventory.
    if (state.location.zoneKey === 'staffTower' && state.hero.savedData.activeTools.staff & 2) {
        state.hero.savedData.activeTools.staff &= ~2;
    }

    const floor = state.zone.floors[location.floor];
    if (!floor) {
        console.log('Invalid floor', state.location);
        return;
    }
    state.floor = floor;
    state.areaGrid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    state.location.areaGridCoords = {
        y: state.location.areaGridCoords.y % state.areaGrid.length,
        x: state.location.areaGridCoords.x % state.areaGrid[state.location.areaGridCoords.y % state.areaGrid.length].length,
    };
    state.location = getFullZoneLocation(state.location);
    const area = getAreaFromLocation(state.location);
    const alternateArea = getAreaFromLocation({...state.location, isSpiritWorld: !state.location.isSpiritWorld});

    // Remove all clones on changing areas.
    if (!isMutation) {
        cleanupHeroFromArea(state);
    }
    const lastAreaInstance = state.areaInstance;
    // Use the existing area instances on the transition state if any are present.
    state.areaInstance = state.transitionState?.nextAreaInstance
        || createAreaInstance(state, area);
    state.alternateAreaInstance = state.transitionState?.nextAlternateAreaInstance
        || createAreaInstance(state, alternateArea);
    state.areaInstance.alternateArea = state.alternateAreaInstance;
    state.alternateAreaInstance.alternateArea = state.areaInstance;
    state.fadeLevel = (state.areaInstance.dark || 0) / 100;
    linkObjects(state);
    state.hero.area = state.areaInstance;
    state.hero.areaTime = 0;
    // Don't let magic become infinitely negative while being drained.
    // We could also set magic to at least 0 during any zone transition instead of this.
    state.hero.magic = Math.max(state.hero.magic, 0);
    state.hero.actualMagicRegen = Math.max(state.hero.actualMagicRegen, 0);
    if (!isMutation) {
        state.hero.safeD = state.hero.d;
        state.hero.safeX = location.x;
        state.hero.safeY = location.y;
        state.hero.vx = 0;
        state.hero.vy = 0;
        state.hero.x = location.x;
        state.hero.y = location.y;
        if (location.z >= 0) {
            state.hero.z = location.z;
            /*if (location.z > 0) {
                state.hero.action = 'knocked';
                // Make sure the character falls straight down.
                state.hero.vx = 0;
                state.hero.vy = 0;
            }*/
        }
    }
    setAreaSection(state, !isMutation);
    state.hotLevel = state.areaSection.isHot ? 1 : 0;
    fixCamera(state);
    setConnectedAreas(state, lastAreaInstance);
    checkIfAllEnemiesAreDefeated(state, state.areaInstance);
    for (const object of [...state.areaInstance.objects, ...state.areaInstance.effects]) {
        if (object.onEnterArea) {
            object.onEnterArea(state);
        }
    }
    if (editingState.isEditing && !doNotRefreshEditor) {
        editingState.needsRefresh = true;
    }
    callback?.();
    // Make sure the actor is shown as swimming/wading during the transition frames.
    checkForFloorEffects(state, state.hero);
}
