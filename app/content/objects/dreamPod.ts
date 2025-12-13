import {evaluateLogicDefinition} from 'app/content/logic';
import {objectHash} from 'app/content/objects/objectHash';
import {FRAME_LENGTH} from 'app/gameConstants';;
import {renderHeroShadow} from 'app/renderActor';
import {moveActorTowardsLocation} from 'app/movement/moveActor';
import {showMessage} from 'app/scriptEvents';
import {createAnimation, drawFrameContentAt, getFrame, getFrameHitbox, reverseAnimation} from 'app/utils/animations';
import {enterZoneByTarget} from 'app/utils/enterZoneByTarget';
import {requireFrame} from 'app/utils/packedImages'


const podSouthGeometry = {w: 64, h: 48, content: {x: 20, y: 20, w: 24, h: 24}};
const podSouthFrame = requireFrame('gfx/objects/podSouth.png', {x: 0, y: 0, ...podSouthGeometry});
//const podSouthDoorClosedFrame = requireFrame('gfx/objects/podSouth.png', {x: 0, y: 48, ...podSouthGeometry});
const podSouthDoorOpenAnimation = createAnimation('gfx/objects/podSouth.png', podSouthGeometry, {y: 1, cols: 6}, {loop: false});
const podSouthDoorCloseAnimation = reverseAnimation(podSouthDoorOpenAnimation);

export class DreamPod implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    behaviors: TileBehaviors = {solid: true};
    x: number = this.definition.x;
    y: number = this.definition.y;
    active: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    isObject = <const>true;
    linkedObject: DreamPod;
    isOpen = false;
    heroIsLeaving = false;
    constructor(state: GameState, public definition: EntranceDefinition) {
        this.isOpen = evaluateLogicDefinition(state, this.definition.openLogic, false);
        this.animationTime = this.getAnimation().duration;
    }
    getAnimation() {
        return this.isOpen ? podSouthDoorOpenAnimation : podSouthDoorCloseAnimation;
    }
    getFrame() {
        return getFrame(this.getAnimation(), this.animationTime);
    }
    getHitbox(): Rect {
        return getFrameHitbox(this.getFrame(), this);
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        // When this is the render parent of the hero, it means the hero is using the pod,
        // and we control the animation based on this.
        if (state.hero.renderParent === this) {
            state.hero.isRunning = false;
            state.hero.isControlledByObject = true;
            if (this.heroIsLeaving) {
                if (!this.isOpen) {
                    this.isOpen = true;
                    this.animationTime = 0;
                }
                if (this.animationTime < this.getAnimation().duration) {
                    return;
                }
                const hitbox = this.getHitbox();
                const heroIsMoving = moveActorTowardsLocation(state, state.hero, {
                    x: hitbox.x + hitbox.w / 2,
                    y: hitbox.y + hitbox.h / 2 + 20,
                }, 1, {
                    canPassWalls: true,
                }) > 0;
                if (heroIsMoving) {
                    state.hero.action = 'walking';
                    return;
                }
                delete state.hero.renderParent;
                this.heroIsLeaving = false;
                return;
            }

            // First the hero moves into the pod.
            const hitbox = this.getHitbox();
            const heroIsMoving = moveActorTowardsLocation(state, state.hero, {
                x: hitbox.x + hitbox.w / 2,
                y: hitbox.y + hitbox.h / 2,
            }, 1, {
                canPassWalls: true,
            }) > 0;
            if (heroIsMoving) {
                state.hero.action = 'walking';
                return;
            }
            delete state.hero.action;

            // Next the pod starts to close
            if (this.isOpen) {
                this.isOpen = false;
                this.animationTime = 0;
                return;
            }

            // Hero faces south after the pod starts to close.
            state.hero.d = 'down';

            // Hero transitions to next area when the pod finishes closing.
            if (this.animationTime >= this.getAnimation().duration) {
                enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, {
                    skipObject: this.definition,
                    callback: () => {
                        if (state.hero.renderParent === this) {
                            delete state.hero.renderParent;
                        }
                    }
                });
            }
            return;
        }

        const wasOpen = this.isOpen;
        // Default behavior is to open/close based on the current logic for being open.
        this.isOpen = evaluateLogicDefinition(state, this.definition.openLogic, false);
        if (this.isOpen !== wasOpen) {
            this.animationTime = 0;
        }
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        if (this.definition.d !== 'down' || hero.d !== 'up') {
            return;
        }
        if (hero.isAstralProjection || state.hero !== hero) {
            return;
        }
        delete hero.action;
        if (!this.isOpen) {
            showMessage(state, `It won't open.`);
            return;
        }
        if (!this.definition.targetZone || !this.definition.targetObjectId) {
            showMessage(state, `It doesn't seem to be working.`);
            return;
        }
        state.hero.renderParent = this;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameContentAt(context, podSouthFrame, this);
        if (state.hero.renderParent === this) {
            renderHeroShadow(context, state, state.hero);
            state.hero.render(context, state);
        }
        drawFrameContentAt(context, this.getFrame(), this);
    }
}

objectHash.dreamPod = DreamPod;
