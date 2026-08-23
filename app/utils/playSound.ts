import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {isFieldSceneActive} from 'app/scenes/field/showFieldScene';
import {isObjectInCurrentSection} from 'app/utils/sections';
import {playSound, stopSound} from 'app/utils/sounds';

// Field sounds play at full volume anywhere on screen, then fade out linearly
// over this many pixels past the edge of the screen until they are inaudible.
const MAX_SOUND_FALLOFF_DISTANCE = 144;

function isRay(geometry: Ray|Circle|Rect|Point): geometry is Ray {
    return typeof((geometry as Ray).x1) === 'number';
}
function isCircle(geometry: Circle|Rect|Point): geometry is Circle {
    return typeof((geometry as Circle).r) === 'number';
}
function isRect(geometry: Rect|Point): geometry is Rect {
    return typeof((geometry as Rect).w) === 'number';
}

// Returns how far the point/rectangle is outside the camera viewport in pixels, or 0 if it is on screen.
function getDistanceOutsideViewport(state: GameState, geometry: Ray|Circle|Rect|Point): number {
    let r: Rect;
    if (isRay(geometry)) {
        // TODO: Actually calculate shortest distance from the ray to the view port.
        // For now just use the largest possible rectangle containing the ray.
        const L = Math.min(geometry.x1 - geometry.r, geometry.x2 - geometry.r);
        const R = Math.max(geometry.x1 + geometry.r, geometry.x2 + geometry.r);
        const T = Math.min(geometry.y1 - geometry.r, geometry.y2 - geometry.r);
        const B = Math.min(geometry.y1 + geometry.r, geometry.y2 + geometry.r);
        r = {
            x: L,
            y: T,
            w: R - L,
            h: B - T,
        };
    } else if (isCircle(geometry)) {
        const dx = Math.max(state.camera.x - geometry.x, geometry.x - (state.camera.x + CANVAS_WIDTH), 0);
        const dy = Math.max(state.camera.y - geometry.y, geometry.y - (state.camera.y + CANVAS_HEIGHT), 0);
        return Math.max(0, Math.sqrt(dx * dx + dy * dy) - geometry.r);
    } else  if (isRect(geometry)) {
        r = geometry;
    } else {
        r = {...geometry, w: 0, h: 0};
    }
    const dx = Math.max(state.camera.x - (r.x + r.w), r.x - (state.camera.x + CANVAS_WIDTH), 0);
    const dy = Math.max(state.camera.y - (r.y + r.h), r.y - (state.camera.y + CANVAS_HEIGHT), 0);
    return Math.sqrt(dx * dx + dy * dy);
}

// Volume multiplier for a sound originating from a point/rectangle: 1 when on screen, fading linearly
// to 0 by the time it is MAX_SOUND_FALLOFF_DISTANCE pixels past the edge of the screen.
// A `null` point always plays at full volume (used for sounds with no clear world position).
function getAreaSoundVolume(state: GameState, geometry: Ray|Circle|Rect|Point|null): number {
    if (!geometry) {
        return 1;
    }
    const distance = getDistanceOutsideViewport(state, geometry);
    return Math.max(0, 1 - distance / MAX_SOUND_FALLOFF_DISTANCE);
}

export function playAreaSound(state: GameState, area: AreaInstance, key: string, geometry: Ray|Circle|Rect|Point|null): AudioInstance | undefined {
    // Area sounds should only be played when the field scene is active on the stack.
    // Having this check prevents some background processes from accidentally triggering sounds.
    if (!isFieldSceneActive(state)) {
        return;
    }
    if (!key || state.areaSet?.current !== area) {
        return;
    }
    return playSound(key, 0, false, undefined, getAreaSoundVolume(state, geometry));
}

export function playObjectSound(state: GameState, object: ObjectInstance | EffectInstance, key: string): AudioInstance | undefined {
    // Area sounds should only be played when the field scene is active on the stack.
    // Having this check prevents some background processes from accidentally triggering sounds.
    if (!isFieldSceneActive(state)) {
        return;
    }
    if (!key || !object.area || state.areaSet?.current !== object.area) {
        return;
    }
    if (!isObjectInCurrentSection(state, object)) {
        return;
    }
    const rect = object.getHitbox?.();
    const point = (typeof object.x === 'number' && typeof object.y === 'number') ? {x: object.x, y: object.y} : null;
    return playSound(key, 0, false, undefined, getAreaSoundVolume(state, rect ?? point));
}

export function stopAreaSound(state: GameState, instance: AudioInstance) {
    if (!instance) {
        return;
    }
    stopSound(instance);
}
