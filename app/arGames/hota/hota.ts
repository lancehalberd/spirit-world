import {snakeAnimations} from 'app/content/enemyAnimations';
import {getAreaSize} from 'app/utils/getAreaSize';
import {createAnimation, getFrame, drawFrameCenteredAtPoint} from 'app/utils/animations';
import {FRAME_LENGTH} from 'app/gameConstants';


const fieldWidth = 224;
const rowHeight = 32;
const fieldHeight = 3 * rowHeight;
const towerRadius = 12;

interface HotaScene {
    start: (state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    update: (state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    render: (context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    renderHUD: (context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
}

const battleScene: HotaScene = {
    start(state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        gameState.scene = 'battle';
        for (let i = 0; i < 3; i++) {
            const rowY = gameState.battleField.y + 32 * i;
            gameState.lanes[i].objects.push(new Tower({
                lane: gameState.lanes[i],
                x: gameState.battleField.x + 32 - 16 * i + towerRadius ,
                y: rowY + rowHeight / 2,
            }));
            gameState.lanes[i].objects.push(new Tower({
                lane: gameState.lanes[i],
                x: gameState.battleField.x + gameState.battleField.w - 32 + 16 * i - towerRadius,
                y: rowY + rowHeight / 2,
                isEnemy: true,
            }));
        }

    },
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        /*for (let i = 0; i < gameState.objects.length; i++) {
            gameState.objects[i].update(state, gameState, savedState);
        }*/
        for (let i = 0; i < gameState.lanes.length; i++) {
            const lane = gameState.lanes[i];
            if (lane.winner) {
                continue;
            }
            lane.effects = lane.effects.filter(effect => !effect.done);
            for (let j = 0; j < lane.effects.length; j++) {
                lane.effects[j].update(state, gameState, savedState);
            }
            lane.objects = lane.objects.filter(object => !object.done);
            for (let j = 0; j < lane.objects.length; j++) {
                lane.objects[j].update(state, gameState, savedState);
            }
        }
    },
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        /*for (let i = 0; i < gameState.objects.length; i++) {
            gameState.objects[i].render(context, state, gameState, savedState);
        }*/
        // TODO: Order objects/effects by y value before rendering.
        for (let i = 0; i < gameState.lanes.length; i++) {
            const lane = gameState.lanes[i];
            for (let j = 0; j < lane.objects.length; j++) {
                lane.objects[j].render(context, state, gameState, savedState);
            }
            if (lane.winner) {
                continue;
            }
            for (let j = 0; j < lane.effects.length; j++) {
                lane.effects[j].render(context, state, gameState, savedState);
            }
        }
    },
    renderHUD(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) {
    },
}

const scenes = {
    battle: battleScene,
}

type HotaSceneKey = keyof typeof scenes;
interface HotaHitProperties {
    damage: number
}
interface BaseBattleEffect extends Point {
    lane: HotaLane
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void
}
interface BaseBattleUnit extends Point {
    getLife(): number
    getMaxLife(gameState: HotaState): number
    dx: number
    radius: number
    getRange(): number
    onHit(state: GameState, gameState: HotaState, savedState: HotaSavedState, hit: HotaHitProperties): void
    lane: HotaLane
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void
    target?: BattleObject
    done: boolean
}
type BattleObject = Tower | Minion;
type BattleEffect = MinionBullet;
interface HotaState {
    scene: HotaSceneKey
    // objects: BattleObject[]
    lanes: HotaLane[];
    battleField: Rect
}
interface HotaLane {
    objects: BattleObject[]
    effects: BattleEffect[]
    winner?: 'player'|'enemy'
}
interface HotaSavedState {

}

const coilAnimation = createAnimation('gfx/objects/coils.png', {w: 16, h: 16, content: {x: 4, y: 10, w: 8, h: 4}}, {cols: 2, duration: 10});
interface TowerProps extends Point {
    life?: number
    isEnemy?: boolean
    lane: HotaLane
}
class Tower implements BaseBattleUnit {
    lane = this.props.lane;
    life = this.props.life ?? 250;
    maxLife = this.life;
    isEnemy = this.props.isEnemy ?? false;
    dx = this.isEnemy ? -1 : 1;
    x = this.props.x;
    y = this.props.y;
    damage = 50;
    radius = 12;
    animationTime = 0;
    minions: Minion[] = [];
    minionCooldown = 1000;
    maxMinions = 4;
    target?: BattleObject;
    done = false;
    attackCooldown = 0;
    constructor(public props: TowerProps) {}
    getLife() {
        return this.life
    }
    getMaxLife() {
        return this.maxLife;
    }
    getRange() {
        return 48;
    }
    onHit(state: GameState, gameState: HotaState, savedState: HotaSavedState, hit: HotaHitProperties): void {
        this.life -= hit.damage;
        if (this.life <= 0) {
            this.lane.winner = this.isEnemy ? 'player' : 'enemy';
        }
    }
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        this.animationTime += FRAME_LENGTH;
        this.minions = this.minions.filter(minion => minion.life > 0);
        if (this.minionCooldown > 0) {
            this.minionCooldown -= FRAME_LENGTH;
        } else if (this.minions.length <= this.maxMinions - 2) {
            for (let i = 0; i < 2; i++) {
                const minion = new Minion({
                    lane: this.lane,
                    x: this.x + this.dx * 16,
                    y: this.y - 8 + 16 * i,
                    isEnemy: this.isEnemy,
                });
                this.minions.push(minion);
                this.lane.objects.push(minion);
            }
            this.minionCooldown = 6000;
        }
        updateTarget(this, this.lane.objects.filter(o => o.isEnemy !== this.isEnemy));
        if (this.attackCooldown > 0) {
            this.attackCooldown -= FRAME_LENGTH;
        } else if (this.target) {
            this.attackCooldown = 1000;
            const attack = new MinionBullet({
                x: this.x + this.dx * this.radius,
                y: this.y - 20,
                target: this.target,
                hit: {damage: this.damage},
                innerColor: '#FF0',
                outerColor: '#880',
            });
            this.lane.effects.push(attack);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.life <= 0) {
            // TODO: Render destroyed tower.
            return;
        }
        const frame = getFrame(coilAnimation, this.animationTime);
        context.save();
            context.translate(this.x, this.y);
            context.scale(2, 2);
            drawFrameCenteredAtPoint(context, frame, {x: 0, y: 0});
        context.restore();
        drawUnitLifebar(context, gameState, this, -10);
        //context.fillStyle = 'red';
        //context.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
}
function drawUnitLifebar(context: CanvasRenderingContext2D, gameState: HotaState, unit: BaseBattleUnit, dy = -2) {
    const p = Math.max(0, Math.min(1, unit.getLife() / unit.getMaxLife(gameState)))
    if (p <= 0 || p >= 1) {
        return;
    }
    const w = Math.max(10, unit.radius * 2);
    context.fillStyle = '#000';
    context.fillRect(unit.x - w / 2, unit.y - unit.radius + dy, w, 1);
    context.fillStyle = '#444';
    context.fillRect(unit.x - w / 2, unit.y - unit.radius + dy + 1, w, 1);
    context.fillStyle = '#0A0';;
    context.fillRect(unit.x - w / 2, unit.y - unit.radius + dy, Math.ceil(p * w), 2);
}

interface MinionProps extends Point {
    isEnemy?: boolean
    lane: HotaLane
}
class Minion implements BaseBattleUnit {
    lane = this.props.lane;
    life = 50;
    maxLife = 50;
    isEnemy = this.props.isEnemy ?? false;
    dx = this.isEnemy ? -1 : 1;
    x = this.props.x;
    y = this.props.y;
    radius = 8;
    animationTime = 0;
    // Pixels per second.
    speed = 16;
    damage = 10;
    target?: BattleObject;
    attackCooldown = 0;
    done = false;
    constructor(public props: MinionProps) {}
    getLife() {
        return this.life
    }
    getMaxLife() {
        return this.maxLife;
    }
    getRange() {
        return 32;
    }
    onHit(state: GameState, gameState: HotaState, savedState: HotaSavedState, hit: HotaHitProperties): void {
        this.life -= hit.damage;
    }
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.life <= 0) {
            this.done = true;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        updateTarget(this, this.lane.objects.filter(o => o.isEnemy !== this.isEnemy));
        if (this.attackCooldown > 0) {
            this.attackCooldown -= FRAME_LENGTH;
        }
        if (this.target) {
            if (this.attackCooldown <= 0) {
                this.attackCooldown = 1000;
                const attack = new MinionBullet({
                    x: this.x + this.dx * this.radius,
                    y: this.y - 10,
                    target: this.target,
                    hit: {damage: this.damage},
                });
                this.lane.effects.push(attack);
            }
        } else {
            // Continue moving
            this.x += this.dx * this.speed / FRAME_LENGTH;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        const frame = getFrame(snakeAnimations.idle.left, this.animationTime);
        context.save();
            context.translate(this.x, this.y);
            context.scale(-this.dx, 1);
            drawFrameCenteredAtPoint(context, frame, {x: 0, y: -4});
        context.restore();
        drawUnitLifebar(context, gameState, this, -10);
        //context.fillStyle = 'red';
        //context.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
}
const minionBulletDuration = 300;
interface MinionBulletProps extends Point {
    target: BattleObject
    hit: HotaHitProperties
    innerColor?: string
    outerColor?: string
}
class MinionBullet implements BaseBattleEffect {
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
    constructor(public props: MinionBulletProps) {}
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        this.time += FRAME_LENGTH;
        const p = (this.time / minionBulletDuration);
        const tx = this.target.x - this.dx * this.target.radius;
        this.x = this.sx * (1 - p) + tx * p;
        const ty = this.target.y - 6;
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
function renderBullet(context: CanvasRenderingContext2D, bullet: MinionBullet, r = 4, innerColor = bullet.innerColor, outerColor = bullet.outerColor) {
    context.beginPath();
    context.arc(bullet.x, bullet.y, r, 0, 2 * Math.PI);
    context.fillStyle = outerColor;
    context.fill();
    context.beginPath();
    context.arc(bullet.x, bullet.y, r / 2, 0, 2 * Math.PI);
    context.fillStyle = innerColor;
    context.fill();
}

function updateTarget(attacker: BattleObject, targets: BattleObject[]) {
    const range = attacker.getRange();
    // Remove current target if it is invalid.
    if (attacker.target && (attacker.target.life <= 0 || getDistance(attacker, attacker.target) > range)) {
        delete attacker.target;
    }
    // Find a new target if none is assigned.
    if (!attacker.target) {
        let bestDistance = range;
        for (const target of targets) {
            const distance = getDistance(attacker, target);
            if (distance < bestDistance) {
                bestDistance = distance;
                attacker.target = target;
            }
        }
    }
}

function getDistance(o1: BattleObject, o2: BattleObject): number {
    //return Math.max(0, Math.abs(o1.x - o2.x) - o1.radius - o2.radius);
    const dx = o1.x - o2.x, dy = o1.y - o2.y;
    return Math.max(0, Math.sqrt(dx * dx + dy * dy) - o1.radius - o2.radius);
}

function getNewHotaState(state: GameState): HotaState {
    const {section} = getAreaSize(state);
    const battleField = {
        x: section.x + section.w / 2 - fieldWidth / 2,
        // This is off center a bit to account for northern walls being thicker than southern walls.
        y: section.y + section.h / 2 - fieldHeight / 2 + 16,
        w: fieldWidth,
        h: fieldHeight
    }
    return {
        scene: 'battle',
        lanes: [
            {objects: [], effects: []},
            {objects: [], effects: []},
            {objects: [], effects: []},
        ],
        battleField,
    };
}


function getNewHotaSavedState(): HotaSavedState {
    return {};
}

function startHota(state: GameState) {
    const gameState = getNewHotaState(state);
    state.arState.game = gameState;
    const savedState = state.savedState.savedArData.gameData.hota || {};
    state.savedState.savedArData.gameData.hota = {...getNewHotaSavedState(), ...savedState};
    scenes[gameState.scene].start(state, gameState, savedState);
}

function updateHota(state: GameState) {
    const gameState = state.arState.game as HotaState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    scenes[gameState.scene].update(state, gameState, savedState);
}


function renderHota(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as HotaState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    scenes[gameState.scene].render(context, state, gameState, savedState);
}

function renderHotaHUD(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as HotaState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    scenes[gameState.scene].renderHUD(context, state, gameState, savedState);
}

export const hotaGame: ARGame = {
    start: startHota,
    update: updateHota,
    render: renderHota,
    renderHUD: renderHotaHUD,
};
