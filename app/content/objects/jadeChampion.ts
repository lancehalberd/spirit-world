import {addTextCue} from 'app/content/effects/textCue';
import {isFlameBeastEncounter, updateJadeChampionFlameBeast} from 'app/content/jadeChampion/jadeChampionFlameBeast';
import {isStormBeastEncounter, updateJadeChampionStormBeast} from 'app/content/jadeChampion/jadeChampionStormBeast';
import {objectHash} from 'app/content/objects/objectHash';
import {jadeChampionAnimations} from 'app/content/npcs/npcAnimations'
import {FRAME_LENGTH} from 'app/gameConstants';
import {moveActorTowardsLocation} from 'app/movement/moveActor';
import {shadowFrame, smallShadowFrame} from 'app/renderActor';
import {drawFrame, getFrame} from 'app/utils/animations';
import {directionMap} from 'app/utils/direction';
import {hitTargets} from 'app/utils/field';
import {getCardinalDirectionToTarget} from 'app/utils/target';



// Let's use a scaled version of the recharge/portal graphics as temporary barrier graphics for now:
//const floorAnimations = animationSet('gfx/tiles/spirit_regeneration_bottom.png');
//const backAnimations = animationSet('gfx/tiles/spirit_regeneration_middle.png');
//const frontAnimations = animationSet('gfx/tiles/spirit_regeneration_front.png');

export class JadeChampion implements Actor, ObjectInstance  {
    area: AreaInstance;
    d: CardinalDirection = this.definition.d || 'down';
    drawPriority: 'sprites' = 'sprites';
    isObject = <const>true;
    isAllyTarget = true;
    x = this.definition.x;
    y = this.definition.y;
    doesNotFall = true;
    flying = false;
    life = 1;
    vx = 0;
    vy = 0
    vz = 0;
    z = 0;
    w = 16;
    h = 16;
    groundHeight = 0;
    currentAnimationKey: string = 'idle';
    nextAnimationKey: string;
    currentAnimation = jadeChampionAnimations.idle[this.d];
    animationTime = 0;
    mode = 'choose';
    modeTime = 0;
    speed = 1;
    alpha = 1;
    status: ObjectStatus = 'normal';
    showMessage = false;
    dialogueIndex = 0;
    lastDialogueOption: DialogueOption;
    potions = 1;
    regenerationHints = 0;


    constructor(state: GameState, public definition: SimpleObjectDefinition) {}

    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    getHitbox(): Rect {
        const frame = this.getFrame();
        const scale = 1;
        return {
            x: this.x,
            y: this.y,
            w: (frame.content?.w || frame.w) * scale,
            h: (frame.content?.h || frame.h) * scale,
        };
    }
    getSlashHitbox(): Rect {
        return {
            x: this.x + directionMap[this.d][0] * 24 - Math.abs(directionMap[this.d][1]) * 8,
            y: this.y + directionMap[this.d][1] * 24 - Math.abs(directionMap[this.d][0]) * 8,
            w: (this.d === 'up' || this.d === 'down') ? 32 : 24,
            h: (this.d === 'up' || this.d === 'down') ? 24 : 32,
        };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        // Do nothing.
    }
    changeToAnimation(type: string, nextAnimationKey?: string) {
        this.nextAnimationKey = nextAnimationKey;
        this.currentAnimationKey = type;
        const animationSet = jadeChampionAnimations[type] || jadeChampionAnimations.idle;
        const targetAnimation = animationSet[this.d];
        if (this.currentAnimation !== targetAnimation) {
            this.currentAnimation = targetAnimation;
            this.animationTime = 0;
        }
    }
    setAnimation(type: string, d: Direction, time: number = 0) {
        this.currentAnimationKey = type;
        const animationSet = jadeChampionAnimations[type] || jadeChampionAnimations.idle;
        this.currentAnimation = animationSet[d];
        this.animationTime = time;
    }
    setMode(mode: string) {
        this.mode = mode;
        this.modeTime = 0;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.nextAnimationKey && this.animationTime >= this.currentAnimation?.duration) {
            this.changeToAnimation(this.nextAnimationKey);
        }
        this.modeTime += FRAME_LENGTH;
        if (this.mode === 'choose') {
            if (this.potions > 0 && state.hero.life < 1 * state.hero.savedData.maxLife / 3 || state.hero.life < 4) {
                this.setMode('usePotion');
                addTextCue(state, 'Drink this to recover!', 3000, 1);
                this.d = getCardinalDirectionToTarget(this, state.hero);
                this.changeToAnimation('cast', 'idleSword');
                return;
            }
        }
        if (isFlameBeastEncounter(state, this.area)) {
            updateJadeChampionFlameBeast(state, this);
        } else if (isStormBeastEncounter(state, this.area)) {
            updateJadeChampionStormBeast(state, this);
        } else {
            console.warn('Unrecognized encounter for Jade Champion.');
        }
        if (this.mode === 'usePotion') {
            if (this.modeTime === 1000) {
                this.potions--;
                state.hero.life = state.hero.savedData.maxLife;
            }
            if (this.modeTime >= 1000) {
                if (this.modeTime % 100 === 0) {
                    state.hero.magic = Math.min(state.hero.magic + 1, state.hero.maxMagic);
                }
            }
            if (this.modeTime >= 3000) {
                this.changeToAnimation('idleSword');
                this.setMode('choose');
            }
            return;
        }
        if (this.mode === 'slash') {
            // TODO: Change this to slash animation when we add them.
            this.changeToAnimation('thrust');
            if (this.animationTime === FRAME_LENGTH * this.currentAnimation.frameDuration * 5) {
                hitTargets(state, this.area.alternateArea, {
                    damage: 6,
                    hitbox: this.getSlashHitbox(),
                    hitEnemies: true,
                    source: this,
                });
            }
            if (this.animationTime >= this.currentAnimation.duration) {
                this.changeToAnimation('idleSword');
                this.setMode('recover');
            }
            return;
        }
        if (this.mode === 'recover') {
            if (this.modeTime >= 200) {
                this.setMode('choose');
            }
            return;
        }
    }
    moveTowardsLocation(state: GameState, point: Point, speed = 2): number {
        const amount = moveActorTowardsLocation(state, this, point, speed);
        this.changeToAnimation(amount ? 'moveSword' : 'idleSword');
        return amount;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.applyAlpha(context, () => {
            const frame = this.getFrame();
            const scale = 1;
            drawFrame(context, frame, { ...frame,
                x: this.x - (frame?.content?.x || 0) * scale,
                y: this.y - (frame?.content?.y || 0) * scale - this.z,
                w: frame.w * scale,
                h: frame.h * scale,
            });
        });
        // Debug code for showing slash hitbox.
        /*if (this.mode === 'slash') {
            const box = this.getSlashHitbox();
            context.fillStyle = 'red';
            context.fillRect(box.x, box.y, box.w, box.h);
        }*/
    }
    renderForeground(context: CanvasRenderingContext2D, state: GameState) {
        // Do nothing.
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        this.applyAlpha(context, () => {
            const npcScale = 1;
            const frame = this.z >= 4 ? smallShadowFrame : shadowFrame;
            const hitbox = this.getHitbox();
            const shadowScale = Math.round(hitbox.w / shadowFrame.w);
            const target = {
                x: hitbox.x + (hitbox.w - frame.w * shadowScale) / 2,
                y: hitbox.y + hitbox.h - frame.h * shadowScale + 2 * npcScale,
                w: frame.w * shadowScale,
                h: frame.h * shadowScale,
            };
            drawFrame(context, frame, target);
        });
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.globalAlpha = 0.3;// + 0.2 * Math.cos(this.animationTime / 100);
            this.render(context, state);
        context.restore();
    }
    applyAlpha(context: CanvasRenderingContext2D, callback: () => void) {
        if (this.alpha >= 1) {
            callback();
            return;
        }
        context.save();
            context.globalAlpha *= this.alpha;
            callback();
        context.restore();
    }
}
objectHash.jadeChampion = JadeChampion;

class _JadeChampion extends JadeChampion {}
declare global {
    export interface JadeChampion<T=any> extends _JadeChampion {}
}
