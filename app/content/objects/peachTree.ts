import {objectHash} from 'app/content/objects/objectHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameContentAt, getFrame, getFrameHitbox } from 'app/utils/animations';
import {LootObject} from 'app/content/objects/lootObject';
import {appendScript, showMessage} from 'app/scriptEvents';
import {addObjectToArea} from 'app/utils/objects';

const peachTreeGeometry: FrameDimensions ={w: 92, h: 96, content: {x: 0, y: 72, w: 90, h: 20}};
const peachTreeAnimation = createAnimation('gfx/objects/peachTree.png', peachTreeGeometry, {cols: 5});
const peachTreeGatheringAnimation = createAnimation('gfx/objects/peachTreeDeath.png', peachTreeGeometry, {cols: 5, loop: true});
const peachTreeWeakAnimation = createAnimation('gfx/objects/peachTreeWeak.png', peachTreeGeometry, {cols: 5, duration: 20});
const peachTreeDeathAnimation = createAnimation('gfx/objects/peachTreeDeath.png', peachTreeGeometry, {x: 5, cols: 18});
const peachTreeDeadFrame = peachTreeDeathAnimation.frames[peachTreeDeathAnimation.frames.length - 1];
const peachGeometry: FrameDimensions ={w: 50, h: 50, content: {x: 17, y: 17, w: 16, h: 16}};
const peachAnimation = createAnimation('gfx/objects/peachAnimation.png', peachGeometry, {cols: 9});

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
    specialStatus?: 'gathering'|'dying'|'dead'|'weak';
    animationTime = 0;
    peachAnimationTime = -1;
    constructor(state: GameState, public definition: SimpleObjectDefinition) {
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
            const p = Math.min(1, this.peachAnimationTime / 400);
            lightSources.push({
                x: this.x + 48,
                y: this.y - 24,
                brightness: 0.8 * p,
                radius: 24 * p,
                color: peachLightColor,
            });
        }
        let p = 1;
        if (this.specialStatus === 'weak') {
             p = 0.5;
        } else if (this.specialStatus === 'dying') {
            p = Math.max(0, 1 - this.animationTime / 1000);
        }
        lightSources.push({
            x: this.x + 46,
            y: this.y - 24,
            brightness: 0.6 * p,
            radius: 10 + 50 * p,
            color: {r:200, g: 255, b: 255},
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
        if (this.definition.id === 'spiritTree') {
            appendScript(state, '{@spiritTree.interact}');
            return;
        }
        if (this.specialStatus === 'dead') {
            showMessage(state, '...{|}It feels cold and lifeless.');
        }
    }
    getHitbox(): Rect {;
        return getFrameHitbox(peachTreeDeadFrame, this);
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.peachAnimationTime >= 0) {
            this.peachAnimationTime += FRAME_LENGTH;
            if (this.peachAnimationTime >= peachAnimation.duration) {
                this.peachAnimationTime = -1;
                const peach = new LootObject(state, {id: 'peachCave:fullPeach', type: 'loot', lootType: 'peachOfImmortality', x: this.x + 40, y: this.y + 24, z: 56});
                // Make the glow of the peach item match the glow used by the tree.
                peach.lightColor = peachLightColor;
                peach.time = 2000;
                addObjectToArea(state, this.area, peach);
            }
        }
        if (this.specialStatus === 'gathering') {
            /*if (this.animationTime >= 3000 && this.peachAnimationTime < 0) {
                this.peachAnimationTime = 0;
            }
            if (this.animationTime >= 3000 && (this.animationTime % peachTreeGatheringAnimation.duration) === 0) {
                this.specialStatus = 'dying';
                this.animationTime = 0;
            }*/
        } else if (this.specialStatus === 'dying') {
            if (this.animationTime >= 2000) {
                this.specialStatus = 'dead';
                this.animationTime = 0;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        let frame = getFrame(peachTreeAnimation, this.animationTime);
        if (this.specialStatus === 'gathering') {
            frame = getFrame(peachTreeGatheringAnimation, this.animationTime);
        } else if (this.specialStatus === 'dying') {
            frame = getFrame(peachTreeDeathAnimation, this.animationTime);
        } else if (this.specialStatus === 'dead') {
            frame = peachTreeDeadFrame;
        } else if (this.specialStatus === 'weak') {
            frame = getFrame(peachTreeWeakAnimation, this.animationTime);
        }
        drawFrameContentAt(context, frame, this);
        if (this.peachAnimationTime >= 0) {
            frame = getFrame(peachAnimation, this.peachAnimationTime);
            drawFrameContentAt(context, frame, {x: this.x + 40, y: this.y - 32});
        }
    }
}

objectHash.peachTree = PeachTree;
