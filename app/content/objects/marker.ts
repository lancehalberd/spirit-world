import { getVectorToTarget } from 'app/content/enemies';
import { editingState } from 'app/development/tileEditor';


import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, Rect, MarkerDefinition,
} from 'app/types';


export class Marker implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: MarkerDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(definition: MarkerDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.definition.type === 'spawnMarker') {
            const primaryHero = state.hero.activeClone || state.hero;
            if (this.area === primaryHero.area
                && !primaryHero.isOverPit
                && (primaryHero.action === 'walking' || !primaryHero.action)
                && primaryHero.rollCooldown <= 0
            ) {
                const { mag } = getVectorToTarget(state, this, primaryHero);
                const dx = primaryHero.x - primaryHero.safeX;
                const dy = primaryHero.y - primaryHero.safeY;
                if (mag < 20 && dx * dx + dy * dy >= mag * mag) {
                    // This is simplified becuase marker+hero have the same size hitbox.
                    // Would have to adjust if that changes in the future.
                    primaryHero.safeX = this.x;
                    primaryHero.safeY = this.y;
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (editingState.isEditing) {
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
