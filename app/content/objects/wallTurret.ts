import { CrystalSpike, drawArrow, drawCrystal, EnemyArrow } from 'app/content/effects/arrow';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { directionMap } from 'app/utils/field';

const underFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}).frames[0];
const overFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}, {x: 1}).frames[0];

const tellDuration = 200;

const [workingCanvas, workingContext] = createCanvasAndContext(16, 16);

export const turretStyles = <const>{
    arrow: {
        fire(this: void, state: GameState, turret: WallTurret) {
            const dx = directionMap[turret.definition.d][0];
            const dy = directionMap[turret.definition.d][1];
            EnemyArrow.spawn(state, turret.area, {
                ignoreWallsDuration: 300,
                x: turret.x + turret.w / 2 + dx * 8,
                y: turret.y + turret.h / 2 + dy * 8,
                vx: 4 * dx,
                vy: 4 * dy,
            });
        },
        renderProjectile(this: void, context: CanvasRenderingContext2D, turret: WallTurret) {
            const dx = directionMap[turret.definition.d][0], dy = directionMap[turret.definition.d][1];
            drawArrow(workingContext, 'normal', turret.animationTime, turret.w / 2, turret.h / 2, dx, dy);
        }
    },
    crystal: {
        fire(this: void, state: GameState, turret: WallTurret) {
            const dx = directionMap[turret.definition.d][0];
            const dy = directionMap[turret.definition.d][1];
            CrystalSpike.spawn(state, turret.area, {
                ignoreWallsDuration: 300,
                x: turret.x + turret.w / 2 + dx * 4,
                y: turret.y + turret.h / 2 + dy * 4,
                vx: 4 * dx,
                vy: 4 * dy,
            });
        },
        renderProjectile(this: void, context: CanvasRenderingContext2D, turret: WallTurret) {
            const dx = directionMap[turret.definition.d][0], dy = directionMap[turret.definition.d][1];
            drawCrystal(workingContext, turret.animationTime, turret.w / 2, turret.h / 2, dx, dy);
        }
    },
};

export type TurretStyle = keyof typeof turretStyles;

export class WallTurret implements ObjectInstance {
    area: AreaInstance;
    definition: TurretDefinition;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    x: number;
    y: number;
    w: number = 16;
    h: number = 16;
    animationTime: number = 0;
    fireOverrideTime: number = 0;
    fireInterval: number;
    fireOffset: number;
    style: TurretStyle;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: TurretDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status;
        this.style = definition.style || 'arrow';
        this.animationTime = 0;
        this.fireInterval = this.definition.fireInterval || 3000;
        this.fireOffset = this.definition.fireOffset || 0;
    }
    getHitbox(state: GameState) {
        return this;
    }
    onActivate(state: GameState) {
        if (this.status !== 'normal') {
            this.status = 'normal';
        }
    }
    onDeactivate(state: GameState) {
        if (this.status !== 'off') {
            this.status = 'off';
        }
    }
    fireAfter(milliseconds: number) {
        this.fireOverrideTime = milliseconds;
    }
    fire(state: GameState) {
        const style = turretStyles[this.style] || turretStyles.arrow;
        style.fire(state, this);
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        // If fire override time is set, fire once the cooldown completes
        if (this.fireOverrideTime > 0) {
            this.fireOverrideTime -= FRAME_LENGTH;
            if (this.fireOverrideTime <= 0) {
                this.fire(state);
            }
            return;
        }
        if (this.status === 'normal') {
            if ((this.animationTime - this.fireOffset) % this.fireInterval === 0) {
                this.fire(state);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.definition.d === 'down') {
            drawFrame(context, underFrame, {...underFrame, x: this.x, y: this.y - 2});
        }
        const actualTellDuration = Math.min(tellDuration, this.fireInterval / 2);
        const fireTime = (this.animationTime - this.fireOffset + this.fireInterval) % this.fireInterval;
        if (this.fireOverrideTime > 0 && this.fireOverrideTime <= 600) {
            this.renderTell(context);
        } else if (this.status === "normal"
            && fireTime >= this.fireInterval - actualTellDuration) {
            this.renderTell(context);
        }
        if (this.definition.d === 'down') {
            drawFrame(context, overFrame, {...overFrame, x: this.x, y: this.y - 2});
        }
    }
    renderTell(context: CanvasRenderingContext2D) {
        workingContext.clearRect(0, 0, workingCanvas.width, workingCanvas.height);
        //const dx = directionMap[this.definition.d][0], dy = directionMap[this.definition.d][1];
        const style = turretStyles[this.style] || turretStyles.arrow;
        style.renderProjectile(workingContext, this);
        // drawCrystal(workingContext, this.animationTime, this.w / 2, this.h / 2, dx, dy);
        if (this.definition.d === 'up') {
            context.drawImage(workingCanvas, 0, 0, 16, 8, this.x, this.y - 6, 16, 8);
        } else if (this.definition.d === 'left') {
            context.drawImage(workingCanvas, 0, 0, 8, 16, this.x - 6, this.y, 8, 16);
        } else if (this.definition.d === 'down') {
            context.drawImage(workingCanvas, 0, 4, 16, 12, this.x, this.y + 4, 16, 12);
        } else if (this.definition.d === 'right') {
            context.drawImage(workingCanvas, 8, 0, 8, 16, this.x + 8 + 6, this.y, 8, 16);
        }

    }
}
objectHash.turret = WallTurret;
