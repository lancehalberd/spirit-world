import {addTextCue} from 'app/content/effects/textCue';
import {Enemy} from 'app/content/enemy';
import {isOrbProtectingHeart} from 'app/content/bosses/stormHeart';
import {objectHash} from 'app/content/objects/objectHash';
import {jadeChampionAnimations} from 'app/content/npcs/npcAnimations'
import {FRAME_LENGTH} from 'app/gameConstants';
import {getDistanceToPoint, moveActorTowardsLocation} from 'app/movement/moveActor';
import {shadowFrame, smallShadowFrame} from 'app/renderActor';
import {drawFrame, getFrame} from 'app/utils/animations';
import {directionMap, getCardinalDirection} from 'app/utils/direction';
import {hitTargets} from 'app/utils/field';
import {getCardinalDirectionToTarget} from 'app/utils/target';


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
            const stormBeast = this.area.alternateArea.objects.find(
                target => target instanceof Enemy
                && target.definition.enemyType === 'stormBeast'
            ) as Enemy;
            if (!stormBeast || stormBeast.mode === 'hidden') {
                if (this.modeTime % 10000 === 5000) {
                    addTextCue(state, 'Attack the clouds to reach the heart!', 3000, 0);
                }
                return;
            }
            if (this.currentAnimationKey === 'idle') {
                addTextCue(state, 'Watch out, here it comes!', 3000, 1);
                // TODO: control this with a "isSwordDrawn boolean".
                this.changeToAnimation('idleSword');
            }
            if (stormBeast.mode === 'regenerating' && stormBeast.modeTime >= 2000 && stormBeast.modeTime <= 3000) {
                if (this.regenerationHints === 0) {
                    if (addTextCue(state, 'The beast is drawing energy from the heart to recover!', 3000, 1)) {
                        this.regenerationHints++;
                    }
                } else {
                    addTextCue(state, 'Attack the heart while the beast is recovering!', 3000, 1);
                }
            }
            if (this.potions > 0 && state.hero.life < 1 * state.hero.savedData.maxLife / 3 || state.hero.life < 4) {
                this.setMode('usePotion');
                addTextCue(state, 'Drink this to recover!', 3000, 1);
                this.d = getCardinalDirectionToTarget(this, state.hero);
                this.changeToAnimation('cast', 'idleSword');
                return;
            }
            if (stormBeast.mode === 'attackUntilDamaged' || stormBeast.mode === 'protect') {
                // The storm beast attacks when it is near the platform, so move the Champion to attack it any time
                // it enters this mode.
                const hitbox = stormBeast.getHitbox();
                // Calculate delta from center of area to the storm beast.
                const cx = this.area.w * 16 / 2, cy = this.area.h * 16 / 2;
                const dx = hitbox.x + hitbox.w / 2 - cx;
                const dy = hitbox.y + hitbox.h / 2 - cy;
                const mag = Math.sqrt(dx*dx+dy*dy);
                const targetPosition = {
                    x: cx + dx * 48 / mag,
                    y: cy + dy * 48 / mag,
                };
                // Move the Champion towards the target location for attacking the beast.
                // TODO: use a thrust attack as soon as the Champion is close enough to close the distance.
                if (!this.moveTowardsLocation(state, targetPosition)) {
                    this.d = getCardinalDirection(dx, dy, this.d);
                    this.setMode('slash');
                }
                return;
            }
            // Give the player a hint to go to the material world if they stay too long in the Spirit World while
            // an orb is protecting the heart and the Storm Beast is regenerating.
            if (
                stormBeast.mode === 'regenerate'
                && this.area !== state.hero.area
                && isOrbProtectingHeart(state, this.area.alternateArea)
                && this.modeTime % 10000 === 4000
            ) {
                addTextCue(state, 'There is something in the Spirit World protecting the heart!', 3000, 1);
            }
            const cx = this.area.w * 16 / 2, cy = this.area.h * 16 / 2;
            const theta = Math.PI * (Math.cos(state.fieldTime / 2000) + 1) / 2;
            const idlePosition = {
                x: cx + 56 * Math.cos(theta),
                y: cy + 8 + 32 * Math.abs(Math.sin(theta)),
            };
            const distance = getDistanceToPoint(state, this, idlePosition);
            if (distance > 30 ||
                (distance > 1 && this.currentAnimationKey ==='moveSword')
            ) {
                moveActorTowardsLocation(state, this, idlePosition, 2);
                this.changeToAnimation('moveSword');
            } else {
                this.d = 'up';
                this.changeToAnimation('idleSword');
            }
            return;
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
