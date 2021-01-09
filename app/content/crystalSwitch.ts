import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    CrystalSwitchDefinition, Direction, Frame, GameState,
    MagicElement, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const tilesFrame = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames[0];
export const crystalFrameOff: Frame = {image: tilesFrame.image, x: 16 * 0.5, y: 16 * 28.5, w: 16, h: 16};
const crystalFrameOn: Frame = {image: tilesFrame.image, x: 16 * 8.5, y: 16 * 28.5, w: 16, h: 16};

export class CrystalSwitch implements ObjectInstance {
    behaviors = {
        solid: true,
    };
    drawPriority: 'background' = 'background';
    definition: CrystalSwitchDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    timeLeft: number = 0;
    constructor(definition: CrystalSwitchDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { ...crystalFrameOff, x: this.x, y: this.y };
    }
    onHit(state: GameState, direction: Direction, element: MagicElement): void {
        if (!this.definition.element || this.definition.element === element) {
            this.activate(state);
        }
    }
    activate(state: GameState): void {
        this.status = 'active';
        this.timeLeft = this.definition.timer || 0;
        // If all crystals in this super tile are active, reveal hiddenSwitch objects.
        if (!state.areaInstance.objects.some(o => o.definition?.type === 'crystalSwitch' && o.status !== 'active')) {
            for (const object of state.areaInstance.objects) {
                if (object.status === 'hiddenSwitch') {
                    object.status = 'normal';
                }
                if (object.status === 'closedSwitch') {
                    if (object.changeStatus) {
                        object.changeStatus(state, 'normal');
                    } else {
                        object.status = 'normal';
                    }
                }
            }
        }
    }
    update(state: GameState) {
        if (this.status === 'active' && this.timeLeft > 0) {
            this.timeLeft -= FRAME_LENGTH;
            if (this.timeLeft <= 0) {
                this.status = 'normal';
                console.log('deactivating switch');
                for (const object of state.areaInstance.objects) {
                    if (object.definition.status === 'closedSwitch') {
                        if (object.changeStatus) {
                            console.log('change status to closedSwitch');
                            object.changeStatus(state, 'closedSwitch');
                        } else {
                            object.status = 'closedSwitch';
                        }
                    }
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'active') {
            drawFrame(context, crystalFrameOn, { ...crystalFrameOn, x: this.x, y: this.y });
            // Draw a small bar under the crystal indicating how much longer it will be active.
            if (this.definition.timer) {
                context.fillStyle = 'black';
                context.fillRect(this.x, this.y + crystalFrameOn.h - 1, 16, 1);
                context.fillStyle = 'white';
                context.fillRect(this.x, this.y + crystalFrameOn.h - 1, Math.round(16 * this.timeLeft / this.definition.timer), 1);
            }
        } else {
            drawFrame(context, crystalFrameOff, { ...crystalFrameOff, x: this.x, y: this.y });
        }
    }
}
