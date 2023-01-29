import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { applyBehaviorToTile } from 'app/utils/tileBehavior';

import {
    AreaInstance, GameState, ObjectInstance, Rect
} from 'app/types';


function hitboxToGrid(hitbox: Rect): Rect {
    const x = (hitbox.x / 16) | 0;
    const w = (hitbox.w / 16) | 0;
    const y = (hitbox.y / 16) | 0;
    const h = (hitbox.h / 16) | 0;
    return {x, y, w, h};
}
export function addObjectToArea(state: GameState, area: AreaInstance, object: ObjectInstance): void {
    if (object.area && object.area !== area) {
        removeObjectFromArea(state, object);
    }
    object.area = area;
    if (object.add) {
        object.add(state, area);
    } else {
        area.objects.push(object);
    }

    if (object.definition?.specialBehaviorKey) {
        try {
            specialBehaviorsHash[object.definition.specialBehaviorKey].apply?.(state, object as any);
        } catch (error) {
            console.error(object.definition.specialBehaviorKey);
        }
    }

    if (object.applyBehaviorsToGrid && object.behaviors) {
        const gridRect = hitboxToGrid(object.getHitbox());
        for (let x = gridRect.x; x < gridRect.x + gridRect.w; x++) {
            for (let y = gridRect.y; y < gridRect.y + gridRect.h; y++) {
                applyBehaviorToTile(area, x, y, object.behaviors);
            }
        }
    }
}
export function removeObjectFromArea(state: GameState, object: ObjectInstance, trackId: boolean = true): void {
    if (!object.area) {
        return;
    }
    if (object.definition?.id && trackId) {
        object.area.removedObjectIds.push(object.definition.id);
    }
    if (object.remove) {
        object.remove(state);
        object.area = null;
    } else {
        if (object.cleanup) {
            object.cleanup(state);
        }
        const index = object.area.objects.indexOf(object);
        if (index >= 0) {
            object.area.objects.splice(index, 1);
        }
        object.area = null;
    }
}
