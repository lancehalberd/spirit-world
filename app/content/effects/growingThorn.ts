import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameAt, getFrame} from 'app/utils/animations';
import {removeEffectFromArea} from 'app/utils/effects';
import {canCoverTile, coverTile, hitTargets} from 'app/utils/field';


const thornsTilesIndex = 184;

const growingThornsAnimation = createAnimation('gfx/tiles/thornsspirit.png', {w: 16, h: 16}, {y: 1, cols: 11})

interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
}

export class GrowingThorn implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    w: number = 16;
    h: number = 16;
    delay: number;
    animationTime = 0;
    constructor({x = 0, y = 0, damage = 2, delay = 800}: Props) {
        this.x -= this.w / 2;
        this.y -= this.h / 2;
        this.x = ((x / 16) | 0) * 16;
        this.y = ((y / 16) | 0) * 16;
        this.delay = delay;
        this.damage = damage;
    }
    update(state: GameState) {
        // Cancel the effect if the tile becomes invalid.
        const tx = (this.x / 16) | 0;
        const ty = (this.y / 16) | 0;
        if (!canCoverTile(this.area, tx, ty, thornsTilesIndex)) {
            removeEffectFromArea(state, this);
            return;
        }
        this.animationTime += FRAME_LENGTH;
        // The effect starts dealing damage midway through the animation.
        if (this.animationTime >= growingThornsAnimation.duration / 2) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this,
                knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                hitAllies: true,
            });
        }
        // At the end of the animation, attempt to cover the ground with the matching thorns tile.
        if (this.animationTime >= growingThornsAnimation.duration) {
            coverTile(state, this.area, tx, ty, thornsTilesIndex);
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(growingThornsAnimation, this.animationTime);
        drawFrameAt(context, frame, this);
    }
}
