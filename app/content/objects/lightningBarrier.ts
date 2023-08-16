import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { renderLightningRay } from 'app/render/renderLightning'
import { hitTargets } from 'app/utils/field';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { getVectorToTarget } from 'app/utils/target';


export class Anode implements ObjectInstance {
    area: AreaInstance;
    behaviors = {
        low: true,
        solid: true,
        brightness: 0.5,
        lightRadius: 16,
    };
    drawPriority: 'sprites' = 'sprites';
    definition: AnodeDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    // This flag is used to toggle between on and off states when the barrier is timed
    // to turn off/on after a certain duration.
    // In comparision, when status === 'off', the object is off permanently unless an
    // external event updates its status.
    isOn = true;
    animationTime = 0;
    cathodes: Cathode[] = [];
    cathodeIndex: number = 0;
    constructor(state: GameState, definition: AnodeDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
        // If the flag is set, then the status is toggled to the opposite of the definition.
        if (getObjectStatus(state, definition)) {
            this.status = this.definition.status === 'normal' ? 'off' : 'normal';
        }
    }
    onActivate(state: GameState) {
        if (this.definition.status === 'normal') {
            this.status = 'off'
        } else {
            this.status = 'normal';
        }
        this.animationTime = 0;
        saveObjectStatus(state, this.definition, this.definition.status !== this.status);
    }
    onDeactivate(state: GameState) {
        this.status = this.definition.status;
        this.animationTime = 0;
        saveObjectStatus(state, this.definition, this.definition.status !== this.status);
    }
    turnOn(state: GameState) {
        this.isOn = true;
        this.animationTime = 0;
        this.cathodeIndex++;
    }
    turnOff(state: GameState) {
        this.isOn = false;
        this.animationTime = 0;
    }
    isRunning(state: GameState): boolean {
        return this.status === 'normal' && this.isOn;
    }
    updateCathodes(state: GameState) {
        let closest = 16 * 7;
        for (const object of this.area.objects) {
            if (object.definition?.type !== 'cathode') {
                continue;
            }
            if (object.status !== 'normal') {
                continue;
            }
            const { mag } = getVectorToTarget(state, this, object);
            if (mag < closest - 0.1) {
                this.cathodes = [object as Cathode];
                closest = mag;
            } else if (mag < closest + 0.1) {
                this.cathodes.push(object as Cathode);
            }
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (!this.isRunning(state)) {
            if (this.definition.offInterval && this.animationTime >= this.definition.offInterval) {
                this.turnOn(state);
            }
            return
        }
        if (this.definition.onInterval && this.animationTime >= this.definition.onInterval) {
            this.turnOff(state);
        }
        this.updateCathodes(state);
        if (!this.cathodes.length) {
            return;
        }
        this.cathodeIndex = this.cathodeIndex % this.cathodes.length;
        const cathode = this.cathodes[this.cathodeIndex];
        // The barrier doesn't damage until it has warmed up for a few frames.
        // The lightning blessing make the hero immune to lightning barrier effects.
        if (!state.hero.savedData.passiveTools.lightningBlessing && this.animationTime > 100) {
            hitTargets(state, this.area, {
                canAlwaysKnockback: true,
                canDamageRollingHero: true,
                damage: 4,
                hitRay: {
                    x1: this.x + 8,
                    y1: this.y + 8,
                    x2: cathode.x + 8,
                    y2: cathode.y + 8,
                    r: 5,
                },
                hitAllies: true,
                knockAwayFromHit: true,
            });
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' && this.status !== 'off' ) {
            return;
        }
        renderTransmitter(context, state, this);
        if (!this.isRunning(state)) {
            return;
        }
        const cathode = this.cathodes?.[this.cathodeIndex % this.cathodes?.length];
        if (cathode) {
            renderLightningRay(context, {
                x1: this.x + 8, y1: this.y,
                x2: cathode.x + 8, y2: cathode.y,
                r: 4,
            });
        }
        /*if (this.status === 'normal' && this.cathodes.length) {
            const cathode = this.cathodes[this.cathodeIndex];
            context.strokeStyle = 'yellow';
            context.beginPath();
            context.moveTo(this.x + 8, this.y);
            context.lineTo(cathode.x + 8, cathode.y);
            context.stroke();
        }*/
    }
}

function renderTransmitter(this: void, context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance) {
    context.fillStyle = 'silver';
    context.beginPath();
    context.moveTo(object.x + 4, object.y + 12);
    context.lineTo(object.x + 8, object.y);
    context.lineTo(object.x + 12, object.y + 12);
    context.fill();
    context.beginPath();
    context.arc(object.x + 8, object.y, 4, 0, 2 * Math.PI);
    context.fill();
}

export class Cathode implements ObjectInstance {
    area: AreaInstance;
    behaviors = {
        low: true,
        solid: true,
        brightness: 0.5,
        lightRadius: 16,
    };
    drawPriority: 'sprites' = 'sprites';
    definition: SimpleObjectDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        renderTransmitter(context, state, this);
    }
}
objectHash.anode = Anode;
objectHash.cathode = Cathode;
