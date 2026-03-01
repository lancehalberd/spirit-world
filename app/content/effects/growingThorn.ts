import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameAt, getFrame} from 'app/utils/animations';
import {removeEffectFromArea} from 'app/utils/effects';
import {canCoverTile, coverTile, hitTargets, uncoverTile} from 'app/utils/field';


const thornsTilesIndex = 184;
// const thornHolesTilesIndex = 202;

const growingThornsAnimation = createAnimation('gfx/tiles/thornsspirit.png', {w: 16, h: 16}, {y: 1, cols: 11})

interface Props {
    x?: number
    y?: number
    damage?: number
    delay?: number
    animationSpeed?: number
    source: Enemy
}

export class GrowingThorn implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage = this.props.damage ?? 1;
    drawPriority: DrawPriority = 'background';
    isNeutralTarget = true;
    w: number = 16;
    h: number = 16;
    x: number = ((this.props.x - this.w / 2) / 16 | 0) * 16;
    y: number = ((this.props.y - this.h / 2) / 16 | 0) * 16;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    delay: number = this.props.delay ?? 0;
    animationTime = 0;
    animationSpeed = this.props.animationSpeed ?? 1;
    source: Enemy = this.props.source;
    constructor(public props: Props) {
    }
    getHitbox() {
        return this;
    }
    onHit(state: GameState, hit: HitProperties) {
        if (this.area && hit.cutsGround) {
            const tx = (this.x / 16) | 0;
            const ty = (this.y / 16) | 0;
            // If the hero cuts the ground mid animation, cover and uncover it immediately
            // to show the particle effects and cut ground tile.
            if (canCoverTile(this.area, tx, ty, thornsTilesIndex)) {
                coverTile(state, this.area, tx, ty, thornsTilesIndex, this.source);
                uncoverTile(state, this.area, tx, ty);
            }
            removeEffectFromArea(state, this);
        }
        return {};
    }
    isInvald() {
        const tx = (this.x / 16) | 0;
        const ty = (this.y / 16) | 0;
        return !canCoverTile(this.area, tx, ty, thornsTilesIndex) || GrowingThorn.isSpotTaken(this.area, this, this);
    }
    // Thorns look bad if they stack up on the same spot so we will remove a thorn that gets
    // added to a spot that already has thorns growing in it.
    // It would be better to have a generic solution for this, but we can wait on that until
    // we encounter other problems.
    update(state: GameState) {
        // Cancel the effect if the tile becomes invalid.
        const tx = (this.x / 16) | 0;
        const ty = (this.y / 16) | 0;
        if (this.isInvald()) {
            removeEffectFromArea(state, this);
            return;
        }
        if (this.delay) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.animationTime += this.animationSpeed * FRAME_LENGTH;
        // The effect starts dealing damage midway through the animation.
        if (this.animationTime >= growingThornsAnimation.duration / 2) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this,
                knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                hitAllies: true,
                isGroundHit: true,
                source: this.source,
            });
        }
        // At the end of the animation, attempt to cover the ground with the matching thorns tile.
        if (this.animationTime >= growingThornsAnimation.duration) {
            coverTile(state, this.area, tx, ty, thornsTilesIndex, this.source);
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // During delay, play the first frames as a warning.
        const animationTime = this.delay
            ? (this.delay % (3 * FRAME_LENGTH * growingThornsAnimation.frameDuration))
            : this.animationTime;
        const frame = getFrame(growingThornsAnimation, animationTime);
        drawFrameAt(context, frame, this);
    }
    cleanup(state: GameState) {
        const tx = (this.x / 16) | 0;
        const ty = (this.y / 16) | 0;
        if (canCoverTile(this.area, tx, ty, thornsTilesIndex)) {
            coverTile(state, this.area, tx, ty, thornsTilesIndex, this.source);
            if (this.animationTime <= growingThornsAnimation.duration / 2) {
                uncoverTile(state, this.area, tx, ty);
            }
        }
    }

    static isSpotTaken(area: AreaInstance, {x, y}: Point, skipEffect?: GrowingThorn) {
        for (const effect of area.effects) {
            if ((!skipEffect || effect !== skipEffect) && effect instanceof GrowingThorn
                && effect.x === x && effect.y === y
                && effect.animationTime >= (skipEffect?.animationTime ?? 0)
            ) {
                return true;
            }
        }
        return false;
    }

    static canGrowAtPoint(area: AreaInstance, {x, y}: Point) {
        const tx = ((x - 8) / 16) | 0;
        const ty = ((y - 8) / 16) | 0;
        return canCoverTile(area, tx, ty, thornsTilesIndex) && !GrowingThorn.isSpotTaken(area, {x: tx, y: ty});
    }
}
