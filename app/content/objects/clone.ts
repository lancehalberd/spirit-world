import { Hero } from 'app/content/hero';

import { renderHeroShadow } from 'app/renderActor';
import { carryMap, directionMap, directionToLeftRotationsFromRight, rotateDirection } from 'app/utils/direction';


export class Clone extends Hero {
    canPressSwitches = true;
    carryRotationOffset: number;
    ignorePits = true;
    uncontrollable = false;
    constructor(hero: Hero) {
        super();
        for (let k in hero) {
            this[k] = hero[k];
        }
        this.isClone = true;
        this.invulnerableFrames = 0;
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }

    onGrab(state: GameState, direction: Direction, hero: Hero) {
        this.action = 'beingCarried';
        this.carrier = hero;
        // Track the clone rotation relative to the hero picking it up so we can rotate it correctly if the hero
        // changes directions.
        this.carryRotationOffset = directionToLeftRotationsFromRight[this.d] - directionToLeftRotationsFromRight[hero.d];
        hero.pickUpObject = this;
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        renderHeroShadow(context, state, this);
    }
    update(state: GameState) {
        if (this.carrier) {
            if (this.carrier.area === this.area) {
                this.updateCoords(state);
            } else {
                this.carrier = null;
                this.action = 'knocked';
                this.animationTime = 0;
            }
        }
    }
    updateCoords(state: GameState) {
        const offset = carryMap[this.carrier.d][Math.min(this.carrier.pickUpFrame, carryMap[this.carrier.d].length - 1)];
        if (!this.carrier || !offset) {
            debugger;
        }
        const [dx, dy] = directionMap[this.carrier.d];
        this.x = this.carrier.x + offset.x + dx;
        this.y = this.carrier.y + dy;
        this.z = -offset.y;
        this.d = rotateDirection(this.carrier.d, this.carryRotationOffset);
    }
}
