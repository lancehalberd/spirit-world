import { objectHash } from 'app/content/objects/objectHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { deactivateTargets, getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { checkIfAllSwitchesAreActivated } from 'app/utils/switches';


const crystalGeometry = {w: 16, h: 20, content: {x: 0, y: 4, w: 16, h: 16, }};
const [baseFrame, crystalFrame, activeCrystalFrame] = createAnimation('gfx/objects/activatablecrystal.png', crystalGeometry, {cols: 3}).frames;
const whiteGlowFrames = createAnimation('gfx/objects/activatablecrystal.png', crystalGeometry, {x: 3, cols: 3}).frames;
const redGlowFrames = createAnimation('gfx/objects/activatablecrystal.png', crystalGeometry, {x: 6, cols: 3}).frames;
const blueGlowFrames = createAnimation('gfx/objects/activatablecrystal.png', crystalGeometry, {x: 9, cols: 3}).frames;

export class CrystalSwitch implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = false;
    behaviors: TileBehaviors = {
        low: true,
        solid: true,
    };
    isNeutralTarget = true;
    drawPriority: DrawPriority = 'sprites';
    definition: CrystalSwitchDefinition = null;
    linkedObject: CrystalSwitch;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    timeLeft: number = 0;
    animationTime: number = 0;
    // This will be set to keep a switch on even if it has a timer.
    stayOn: boolean = false;
    constructor(state: GameState, definition: CrystalSwitchDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        if (getObjectStatus(state, this.definition)) {
            this.status = 'active';
        }
    }
    getLightSources(state: GameState): LightSource[] {
        let brightness = 0.5, radius = 16;
        if (this.status === 'active') {
            if (this.definition.timer && this.timeLeft <= 1000 || this.timeLeft <= this.definition.timer / 4) {
                brightness = 0.6;
                radius = 24;
            } else if (this.definition.timer && this.timeLeft <= 2000 || this.timeLeft <= this.definition.timer / 2) {
                brightness = 0.8;
                radius = 32;
            } else {
                brightness = 1;
                radius = 40;
            }
        }
        return [{
            x: this.x + 8,
            y: this.y + 3,
            brightness,
            radius,
        }];
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (!this.definition.element || this.definition.element === hit.element) {
            this.activate(state);
        }
        return { pierced: true, hit: true };
    }
    activate(state: GameState): void {
        if (this.status !== 'active' || (this.definition.timer && this.timeLeft < this.definition.timer - 200)) {
            playAreaSound(state, this.area, 'activateCrystalSwitch');
        }
        this.status = 'active';
        saveObjectStatus(state, this.definition);
        this.animationTime = 0;
        this.timeLeft = this.definition.timer || 0;
        if (checkIfAllSwitchesAreActivated(state, this.area, this)) {
            if (this.definition.stayOnAfterActivation) {
                this.stayOn = true;
            }
        }
        if (this.definition.specialBehaviorKey) {
            const specialBehavior = specialBehaviorsHash[this.definition.specialBehaviorKey] as SpecialSwitchBehavior;
            specialBehavior?.onActivate(state, this);
        }
        if (this.linkedObject) {
            this.linkedObject.status = 'active';
            this.linkedObject.animationTime = 0;
            this.linkedObject.timeLeft = this.definition.timer || 0;
            if (checkIfAllSwitchesAreActivated(state, this.linkedObject.area, this.linkedObject)) {
                if (this.linkedObject.definition.stayOnAfterActivation) {
                    this.linkedObject.stayOn = true;
                }
            }
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.status === 'active' && (this.timeLeft > 0 && !this.stayOn)) {
            this.timeLeft -= FRAME_LENGTH;
            if (this.timeLeft <= 0) {
                this.status = 'normal';
                deactivateTargets(state, this.area, this.definition.targetObjectId);
                playAreaSound(state, this.area, 'deactivateCrystalSwitch');
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
        if (this.definition.element) {
            context.save();
                context.globalAlpha *= 0.8;
                context.beginPath();
                context.fillStyle = {fire: 'red', ice: '#08F', lightning: 'yellow'}[this.definition.element];
                context.arc(
                    this.x + 8,
                    this.y + 2,
                    2,
                    0, 2 * Math.PI
                );
                context.fill();
            context.restore();
        }
    }
}
objectHash.crystalSwitch = CrystalSwitch;

class _CrystalSwitch extends CrystalSwitch {}
declare global {
    export interface CrystalSwitch extends _CrystalSwitch {}
}
