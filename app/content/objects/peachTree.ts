import {objectHash} from 'app/content/objects/objectHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameContentAt, getFrame, getFrameHitbox, requireFrame} from 'app/utils/animations';
import {LootObject} from 'app/content/objects/lootObject';
import {showMessage} from 'app/scriptEvents';
import {clamp} from 'app/utils/index';
import {addObjectToArea, getObjectStatus, saveObjectStatus} from 'app/utils/objects';

const peachGeometry: FrameDimensions ={w: 48, h: 48, content: {x: 16, y: 16, w: 16, h: 16}};
const peachAnimation = createAnimation('gfx/objects/peachAnimation.png', peachGeometry, {cols: 16, duration: 4});


const peachTreeGeometry: FrameDimensions = {w: 80, h: 96, content: {x: 9, y: 76, w: 54, h: 20}};
const peachTreeFrame = requireFrame('gfx/objects/peachTree2.png', {x: 0, y: 0, ...peachTreeGeometry});
const peachTreeDeadFrame = requireFrame('gfx/objects/peachTreeDead.png', {x: 0, y: 0, ...peachTreeGeometry});
// const peachTreeEnergyAnimation = createAnimation('gfx/objects/peachTreeCondensed22.png', peachTreeGeometry, {cols: 22, duration: 20});
const peachTreeEnergyAnimation = createAnimation('gfx/objects/peachTreeCondensed16.png', peachTreeGeometry, {cols: 16, duration: 20});
let cols = 5360 / 80;
const peachTreeGatherEnergyToRoots
    = createAnimation('gfx/objects/peachTreeGatherAnimation.png', peachTreeGeometry, {y: 0, cols, duration: 2});
const peachTreeGatherEnergyToBranch
    = createAnimation('gfx/objects/peachTreeGatherAnimation.png', peachTreeGeometry, {y: 3, cols, duration: 3});
cols = 3680 / 80;
const peachTreeWeakEnergyAnimation = createAnimation('gfx/objects/peachTreeWeak.png', peachTreeGeometry, {y: 1, cols, duration: 20});
/*const peachTreeGatherEnergyAnimations = [
    // Thin lines going down
    createAnimation('gfx/objects/peachTreeGatherAnimation.png', peachTreeGeometry, {y: 0, cols, duration: 1}),
    // Glowing lines going down
    //createAnimation('gfx/objects/peachTreeGatherAnimation.png', peachTreeGeometry, {y: 1, cols, duration: 5}),
    // Thin lines going up
    //createAnimation('gfx/objects/peachTreeGatherAnimation.png', peachTreeGeometry, {y: 2, cols, duration: 1}),
    // Glowing lines going up
    createAnimation('gfx/objects/peachTreeGatherAnimation.png', peachTreeGeometry, {y: 3, cols, duration: 5}),
];*/



const peachLightColor = {r:255, g: 200, b: 0};
export class PeachTree implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    isNeutralTarget = true;
    isObject = <const>true;
    ignorePits = true;
    x = this.definition.x;
    y = this.definition.y;
    status: ObjectStatus = 'normal';
    specialStatus?: 'gathering'|'dying'|'dead'|'weak'|'reviving';
    animationTime = 0;
    peachAnimationTime = -1;
    constructor(state: GameState, public definition: SimpleObjectDefinition) {
        // All normal peach trees start dead until they are revived.
        if (!getObjectStatus(state, definition)) {
            this.specialStatus = 'dead';
        }
    }
    gatherEnergy(state: GameState) {
        this.specialStatus = 'gathering';
        this.animationTime = 0;
    }
    growPeach(state: GameState) {
        this.specialStatus = 'dying';
        this.animationTime = 0;
        this.peachAnimationTime = 0;
    }
    getLightSources(state: GameState): LightSource[] {
        const lightSources: LightSource[] = [];
        if (this.specialStatus === 'dead') {
            return lightSources;
        }
        if (this.peachAnimationTime >= 0) {
            const p = Math.min(1, this.peachAnimationTime / peachAnimation.duration);
            lightSources.push({
                x: this.x + 32,
                y: this.y - 50,
                brightness: 0.8 * p,
                radius: 24 * p,
                color: peachLightColor,
            });
        }
        let p = 1;
        if (this.specialStatus === 'weak') {
             p = 0.5;
        } else if (this.specialStatus === 'dying') {
            p = clamp(1 - this.animationTime / 1000, 0, 1);
        } else if (this.specialStatus === 'reviving') {
            p = clamp(this.animationTime / 3000, 0, 1);
        }
        lightSources.push({
            x: this.x + 30,
            y: this.y - 45 * p,
            brightness: 0.4 * p,
            radius: 10 + 40 * p,
            color: {r: 150, g: 55 + (200 * p ) | 0, b: (200 * p) | 0},
        });
        return lightSources;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        // Allow the player to throw bushes over the tree to hit the boss.
        if (hit.isThrownObject) {
            return {};
        }
        return {blocked: true};
    }
    behaviors = {solid: true};
    /*getYDepth(): number {
        const hitbox = this.getHitbox();
        return hitbox.y + hitbox.h - 57;
    }*/
    onGrab(state: GameState) {
        state.hero.action = null;
        if (this.specialStatus === 'dead') {
            if (state.hero.savedData.collectibles.magicBeans > 0) {
                state.hero.savedData.collectibles.magicBeans--;
                saveObjectStatus(state, this.definition, true);
                this.specialStatus = 'reviving';
                this.animationTime = 0;
                return;
            }
            showMessage(state, '...{|}It feels cold and lifeless.');
        }
    }
    getHitbox(): Rect {;
        return getFrameHitbox(peachTreeDeadFrame, this);
    }
    update(state: GameState) {
        // For debugging the peach growing animation.
        //if (this.animationTime > 500 + peachAnimation.duration) {
        //    this.growPeach(state);
        //}
        this.animationTime += FRAME_LENGTH;
        if (this.peachAnimationTime >= 0) {
            this.peachAnimationTime += FRAME_LENGTH;
            if (this.peachAnimationTime >= peachAnimation.duration) {
                this.peachAnimationTime = -1;
                const peach = new LootObject(state, {id: 'peachCave:fullPeach', type: 'loot', lootType: 'peachOfImmortality',
                    x: this.x + 23, y: this.y + 20, z: 78});
                // Make the glow of the peach item match the glow used by the tree.
                peach.lightColor = peachLightColor;
                peach.time = 2000;
                addObjectToArea(state, this.area, peach);
            }
        }
        if (this.specialStatus === 'dying') {
            if (this.animationTime >= 2000) {
                this.specialStatus = 'dead';
                this.animationTime = 0;
            }
        } else if (this.specialStatus === 'reviving') {
            if (this.animationTime >= 4000) {
                delete this.specialStatus;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
         if (this.specialStatus === 'dying') {
            drawFrameContentAt(context, peachTreeFrame, this);
            context.save();
                // This should start at the same percentage that we use for weak.
                context.globalAlpha *= (0.5 + 0.5 * this.animationTime / 2000);
                drawFrameContentAt(context, peachTreeDeadFrame, this);
            context.restore();
        } else if (this.specialStatus === 'reviving') {
            drawFrameContentAt(context, peachTreeFrame, this);
            context.save();
                // 1 -> 0 over [3000, 4000]
                context.globalAlpha *= clamp((4000 - this.animationTime) / 1000, 0, 1);
                drawFrameContentAt(context, peachTreeDeadFrame, this);
            context.restore();
        } else if (this.specialStatus === 'dead') {
            drawFrameContentAt(context, peachTreeDeadFrame, this);
        } else if (this.specialStatus === 'weak') {
            drawFrameContentAt(context, peachTreeFrame, this);
            context.save();
                context.globalAlpha *= 0.5;
                drawFrameContentAt(context, peachTreeDeadFrame, this);
            context.restore();
        } else {
            drawFrameContentAt(context, peachTreeFrame, this);
        }
        if (this.specialStatus === 'weak') {
            let waves = 3;
            for (let waveIndex = 0; waveIndex < waves; waveIndex++) {
                const animation = peachTreeWeakEnergyAnimation;
                const frameDuration = FRAME_LENGTH * animation.frameDuration;
                context.save();
                    context.globalAlpha *= 0.8;
                    blurFrames(context, animation, this.animationTime + waveIndex * animation.duration / waves, 2 * frameDuration,
                        (context: CanvasRenderingContext2D, frame: Frame) => {
                            drawFrameContentAt(context, frame, this);
                        },
                    );
                context.restore();
            }
        } else if (this.specialStatus === 'gathering' || this.specialStatus === 'dying') {
            let waves = 3;
            const dyingCoefficient = this.specialStatus === 'dying' ? clamp((1000 - this.animationTime) / 1000, 0, 1) : 1;
            for (let waveIndex = 0; waveIndex < waves; waveIndex++) {
                const animation = peachTreeGatherEnergyToRoots;
                const frameDuration = FRAME_LENGTH * animation.frameDuration;
                context.save();
                    context.globalAlpha *= 0.8 * dyingCoefficient;
                    blurFrames(context, animation, this.animationTime + waveIndex * animation.duration / waves, 2 * frameDuration,
                        (context: CanvasRenderingContext2D, frame: Frame) => {
                            drawFrameContentAt(context, frame, this);
                        },
                    );
                context.restore();
            }
            waves = 6;
            for (let waveIndex = 0; waveIndex < waves; waveIndex++) {
                const animation = peachTreeGatherEnergyToBranch;
                const frameDuration = FRAME_LENGTH * animation.frameDuration;
                context.save();
                    context.globalAlpha *= 0.8 * dyingCoefficient;
                    blurFrames(context, animation, this.animationTime + waveIndex * animation.duration / waves, 2 * frameDuration,
                        (context: CanvasRenderingContext2D, frame: Frame) => {
                            drawFrameContentAt(context, frame, this);
                        },
                    );
                context.restore();
            }
        } else if (this.specialStatus !== 'dead') {
            const frameDuration = FRAME_LENGTH * peachTreeEnergyAnimation.frameDuration;
            const revivingCoefficient = this.specialStatus === 'reviving' ? clamp(this.animationTime / 3000, 0, 1) : 1;
            context.save();
                context.globalAlpha *= revivingCoefficient * 0.8;
                blurFrames(context, peachTreeEnergyAnimation, this.animationTime, 2 * frameDuration,
                    (context: CanvasRenderingContext2D, frame: Frame) => {
                        drawFrameContentAt(context, frame, this);
                    },
                );
            context.restore();
        }
        if (this.peachAnimationTime >= 0) {
            const frame = getFrame(peachAnimation, this.peachAnimationTime);
            drawFrameContentAt(context, frame, {x: this.x + 25, y: this.y - 54});
        }
    }
}

function blurFrames(
    context: CanvasRenderingContext2D,
    animation: FrameAnimation,
    animationTime: number,
    // In milliseconds.
    blurRadius: number,
    drawFrame: (context: CanvasRenderingContext2D, frame: Frame) => void
) {
    const frameDuration = FRAME_LENGTH * animation.frameDuration;
    const startFrame = ((animationTime - blurRadius) / frameDuration | 0);
    const endFrame = ((animationTime + frameDuration + blurRadius) / frameDuration | 0);
    for (let frameIndex = startFrame; frameIndex <= endFrame; frameIndex++) {
        context.save();
            // Frame is at full opacity for the period of [frameIndex * frameDuration, (frameIndex + 1) * frameDuration]
            // and fades out to 0 after blurRadius ms
            const frameStartTime = frameIndex * frameDuration;
            const frameEndTime = frameStartTime + frameDuration;
            if (animationTime < frameStartTime) {
                context.globalAlpha *= clamp(1 - (frameStartTime - animationTime) / blurRadius, 0, 1);
            } else if (animationTime > frameEndTime) {
                context.globalAlpha *= clamp(1 - (animationTime - frameEndTime) / blurRadius, 0, 1);
            }
            const frame = getFrame(animation, frameIndex * frameDuration);
            drawFrame(context, frame);
        context.restore();
    }
}

objectHash.peachTree = PeachTree;
