import {
    changeObjectStatus,
    checkIfAllSwitchesAreActivated,
    findObjectInstanceById,
} from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';

import {
    CrystalSwitchDefinition, Direction, DrawPriority, GameState,
    MagicElement, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const crystalGeometry = {w: 16, h: 20, content: {x: 0, y: 4, w: 16, h: 16, }};
const [baseFrame, crystalFrame] = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {cols: 2}).frames;
const whiteGlowAnimation = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {x: 2, cols: 3, frameMap: [0, 1, 2, 1]});
const redGlowAnimation = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {x: 5, cols: 3, frameMap: [0, 1, 2, 1]});
const blueGlowAnimation = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {x: 8, cols: 3, frameMap: [0, 1, 2, 1]});

export class CrystalSwitch implements ObjectInstance {
    behaviors = {
        solid: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition: CrystalSwitchDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    timeLeft: number = 0;
    animationTime: number = 0;
    constructor(definition: CrystalSwitchDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, direction: Direction, element: MagicElement): void {
        if (!this.definition.element || this.definition.element === element) {
            this.activate(state);
        }
    }
    activate(state: GameState): void {
        this.status = 'active';
        this.animationTime = 0;
        this.timeLeft = this.definition.timer || 0;
        checkIfAllSwitchesAreActivated(state, this);
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.status === 'active' && this.timeLeft > 0) {
            this.timeLeft -= FRAME_LENGTH;
            if (this.timeLeft <= 0) {
                this.status = 'normal';
                if (this.definition.targetObjectId) {
                    const target = findObjectInstanceById(state.areaInstance, this.definition.targetObjectId);
                    if (target && target.definition.status === 'closedSwitch') {
                        changeObjectStatus(state, target, 'closedSwitch');
                    }
                    return;
                }
                for (const object of state.areaInstance.objects) {
                    if (object.definition?.status === 'closedSwitch') {
                        changeObjectStatus(state, object, 'closedSwitch');
                    }
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const target = { ...baseFrame, x: this.x - baseFrame.content.x, y: this.y - baseFrame.content.y };
        drawFrame(context, baseFrame, target);
        let glowAnimation = whiteGlowAnimation;
        if (this.definition.element === 'fire') {
            glowAnimation = redGlowAnimation;
        } else if (this.definition.element === 'ice') {
            glowAnimation = blueGlowAnimation;
        } else {
            glowAnimation = whiteGlowAnimation;
        }
        if (this.status === 'active') {
            drawFrame(context, crystalFrame, target);
            const frame = getFrame(glowAnimation, this.animationTime);
            drawFrame(context, frame, target);
            // Draw a small bar under the crystal indicating how much longer it will be active.
            if (this.definition.timer) {
                context.fillStyle = 'black';
                context.fillRect(this.x, this.y + 14, 16, 1);
                context.fillStyle = 'white';
                context.fillRect(this.x, this.y + 14, Math.round(16 * this.timeLeft / this.definition.timer), 1);
            }
        } else {
            const frame = getFrame(glowAnimation, 0);
            drawFrame(context, frame, target);
        }
    }
}
