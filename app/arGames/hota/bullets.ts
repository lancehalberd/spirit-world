import {FRAME_LENGTH} from 'app/gameConstants';

const minionBulletDuration = 300;
interface BasicBulletProps extends Point {
    target: BattleObject
    hit: HotaHitProperties
    innerColor?: string
    outerColor?: string
}
export class BasicBullet implements BaseBattleEffect {
    x = this.props.x;
    y = this.props.y;
    target = this.props.target;
    hit = this.props.hit;
    lane = this.target.lane;
    sx = this.x;
    sy = this.y;
    dx = -this.target.dx;

    time = 0;
    done = false;
    outerColor = this.props.innerColor ?? '#F00';
    innerColor = this.props.outerColor ?? '#800';
    constructor(public props: BasicBulletProps) {}
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        this.time += FRAME_LENGTH;
        const p = (this.time / minionBulletDuration);
        const tx = this.target.x - this.dx * this.target.radius;
        this.x = this.sx * (1 - p) + tx * p;
        const ty = this.target.y - (this.target.hitHeight ?? 0);
        this.y = this.sy * (1 - p) + ty * p; // + 20 * p * (p - 1);
        if (this.time >= minionBulletDuration) {
            this.done = true;
            this.target.onHit(state, gameState, savedState, this.hit);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        renderBullet(context, this, 3);
    }
}
function renderBullet(context: CanvasRenderingContext2D, bullet: BasicBullet, r = 4, innerColor = bullet.innerColor, outerColor = bullet.outerColor) {
    context.beginPath();
    context.arc(bullet.x, bullet.y, r, 0, 2 * Math.PI);
    context.fillStyle = outerColor;
    context.fill();
    context.beginPath();
    context.arc(bullet.x, bullet.y, r / 2, 0, 2 * Math.PI);
    context.fillStyle = innerColor;
    context.fill();
}
