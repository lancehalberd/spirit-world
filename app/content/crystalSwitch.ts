import {
    checkIfAllSwitchesAreActivated,
    deactivateTargets,
} from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, CrystalSwitchDefinition, Direction, DrawPriority, GameState,
    MagicElement, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const crystalGeometry = {w: 16, h: 20, content: {x: 0, y: 4, w: 16, h: 16, }};
const [baseFrame, crystalFrame, activeCrystalFrame] = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {cols: 3}).frames;
const whiteGlowFrames = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {x: 3, cols: 3}).frames;
const redGlowFrames = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {x: 6, cols: 3}).frames;
const blueGlowFrames = createAnimation('gfx/tiles/activatablecrystal.png', crystalGeometry, {x: 9, cols: 3}).frames;

export class CrystalSwitch implements ObjectInstance {
    area: AreaInstance;
    behaviors = {
        low: true,
        solid: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition: CrystalSwitchDefinition = null;
    linkedObject: CrystalSwitch;
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
        checkIfAllSwitchesAreActivated(state, this.area, this);
        if (this.linkedObject) {
            this.linkedObject.status = 'active';
            this.linkedObject.animationTime = 0;
            this.linkedObject.timeLeft = this.definition.timer || 0;
            checkIfAllSwitchesAreActivated(state, this.linkedObject.area, this.linkedObject);
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.status === 'active' && this.timeLeft > 0) {
            this.timeLeft -= FRAME_LENGTH;
            if (this.timeLeft <= 0) {
                this.status = 'normal';
                deactivateTargets(state, this.area, this.definition.targetObjectId);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const target = { ...baseFrame, x: this.x - baseFrame.content.x, y: this.y - baseFrame.content.y };
        drawFrame(context, baseFrame, target);
        let glowFrames = whiteGlowFrames;
        if (this.definition.element === 'fire') {
            glowFrames = redGlowFrames;
        } else if (this.definition.element === 'ice') {
            glowFrames = blueGlowFrames;
        } else {
            glowFrames = whiteGlowFrames;
        }
        if (this.status === 'active') {
            let frame = glowFrames[2];
            if (this.definition.timer && this.timeLeft <= 1000 || this.timeLeft <= this.definition.timer / 4) {
                frame = glowFrames[0];
            } else if (this.definition.timer && this.timeLeft <= 2000 || this.timeLeft <= this.definition.timer / 2) {
                frame = glowFrames[1];
            }
            drawFrame(context, activeCrystalFrame, target);
            drawFrame(context, frame, target);
            // Draw a small bar under the crystal indicating how much longer it will be active.
            /*if (this.definition.timer) {
                context.fillStyle = 'black';
                context.fillRect(this.x, this.y + 14, 16, 1);
                context.fillStyle = 'white';
                context.fillRect(this.x, this.y + 14, Math.round(16 * this.timeLeft / this.definition.timer), 1);
            }*/
        } else {
            drawFrame(context, crystalFrame, target);
        }
    }
}
