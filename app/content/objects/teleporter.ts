import { enterLocation, enterZoneByTarget } from 'app/content/areas';
import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { findObjectInstanceById } from 'app/content/objects';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH } from 'app/gameConstants';
import { directionMap } from 'app/utils/field';
import { isObjectInsideTarget, pad } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, Rect, EntranceDefinition,
} from 'app/types';

export class Teleporter implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: EntranceDefinition = null;
    x: number;
    y: number;
    active: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    disabledTime = 0;
    linkedObject: Teleporter;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = getObjectStatus(state, definition) ? 'normal' : this.definition.status;
    }
    changeStatus(state: GameState, status: ObjectStatus) {
        this.status = status;
        if (this.status === 'normal') {
            saveObjectStatus(state, this.definition);
        }
        if (this.linkedObject && this.linkedObject.status !== status) {
            this.linkedObject.changeStatus(state, status);
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.status !== 'normal' && state.hero.actionTarget !== this) {
            if (state.savedState.objectFlags[this.definition.id]) {
                this.changeStatus(state, 'normal');
            }
            return;
        }
        this.animationTime += FRAME_LENGTH;
        let hero = state.hero.activeClone || state.hero;
        if (this.disabledTime > 0) {
            this.disabledTime -= FRAME_LENGTH;
            return;
        }
        if (hero.actionTarget === this || this.area !== hero.area || !isObjectInsideTarget(hero, pad(this.getHitbox(state), 8))) {
            return;
        }
        if (!this.definition.targetZone) {
            // This is the behavior we want for portals eventually, but we are just adding it
            // to teleporter for now.
            enterLocation(state, {
                ...state.location,
                x: hero.x,
                y: hero.y,
                d: hero.d,
                isSpiritWorld: !state.location.isSpiritWorld,
            }, false, () => {
                // In the future, check if there is a teleporter where the hero ends up and set it to control them
                // so it moves them off of it.
                if (this.linkedObject) {
                    hero.actionTarget = this.linkedObject;
                    this.linkedObject.disabledTime = 500;
                    hero.isUsingDoor = true;
                    hero.actionDx = directionMap[hero.d][0];
                    hero.actionDy = directionMap[hero.d][1];
                }
            });
        } else {
            enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false, () => {
                // We need to reassign hero after calling `enterZoneByTarget` because the active hero may change
                // from one clone to another when changing zones.
                hero = state.hero.activeClone || state.hero;
                hero.isUsingDoor = true;
                const target = findObjectInstanceById(state.areaInstance, this.definition.targetObjectId) as Teleporter;
                if (!target){
                    console.error(state.areaInstance.objects);
                    console.error(this.definition.targetObjectId);
                    debugger;
                }
                hero.actionTarget = target;
                target.disabledTime = 500;
                hero.actionDx = directionMap[hero.d][0];
                hero.actionDy = directionMap[hero.d][1];
            });
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' && !editingState.isEditing) {
            return;
        }
        const gradient = context.createLinearGradient(0, 0, 0, 16);
        gradient.addColorStop(0.2 + 0.1 * Math.cos(this.animationTime / 400), 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.8 + 0.1 * Math.cos(this.animationTime / 400), 'rgba(255, 255, 255, 0.7)');
        context.save();
        context.fillStyle = gradient;
        context.translate(this.x, this.y);
        context.fillRect(0, 0, 16, 16);
        context.restore();
    }
}
