import { objectHash } from 'app/content/objects/objectHash';
import { editingState } from 'app/development/editingState';
import { getVectorToTarget } from 'app/utils/target';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, Rect, MarkerDefinition,
} from 'app/types';


export class Marker implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: MarkerDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    ignorePits = true;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: MarkerDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.definition.type === 'spawnMarker') {
            if (this.area === state.hero.area
                && !state.hero.isOverPit
                && (state.hero.action === 'walking' || !state.hero.action)
                && state.hero.rollCooldown <= 0
            ) {
                const isMarkerActive = Math.abs(state.hero.x - this.x) < 20
                    && Math.abs(state.hero.y - this.y) < 20;
                if (!isMarkerActive) {
                    return;
                }
                const { mag } = getVectorToTarget(state, this, state.hero);
                const dx = state.hero.x - state.hero.safeX;
                const dy = state.hero.y - state.hero.safeY;
                if (dx * dx + dy * dy >= mag * mag) {
                    // This is simplified becuase marker+hero have the same size hitbox.
                    // Would have to adjust if that changes in the future.
                    state.hero.safeX = this.x;
                    state.hero.safeY = this.y;
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Remove `false &&` here to see marker when it is active.
        const isMarkerActive = false && Math.abs(state.hero.x - this.x) < 20
            && Math.abs(state.hero.y - this.y) < 20;
        if (editingState.isEditing || isMarkerActive) {
            context.strokeStyle = 'red';
            context.beginPath();
            context.moveTo(this.x + 2, this.y + 2);
            context.lineTo(this.x + 14, this.y + 14);
            context.moveTo(this.x + 14, this.y + 2);
            context.lineTo(this.x + 2, this.y + 14);
            context.stroke();
        }
    }
}
objectHash.marker = Marker;
objectHash.spawnMarker = Marker;
