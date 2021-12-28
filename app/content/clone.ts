import { removeObjectFromArea } from 'app/content/areas';
import { Hero } from 'app/content/hero';

import { carryMap, directionMap, directionToLeftRotationsFromRight, rotateDirection } from 'app/utils/field';

import {
    Direction, GameState, Rect, TileBehaviors,
} from 'app/types';

export class Clone extends Hero {
    behaviors: TileBehaviors = {
        solid: true,
    };
    carryRotationOffset: number;
    ignorePits = true;
    constructor(hero: Hero) {
        super();
        for (let k in hero) {
            this[k] = hero[k];
        }
        this.isClone = true;
        this.invulnerableFrames = 0;
    }
    getHitbox(state: GameState): Rect {
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

export function destroyClone(state: GameState, clone: Hero): void {
    // Cannot destroy a clone if none remain.
    if (!state.hero.clones.length) {
        return;
    }
    if (clone === state.hero) {
        // If the "clone" destroyed was the hero, then pop the last clone and move the hero to it.
        const lastClone = state.hero.clones.pop();
        state.hero.x = lastClone.x;
        state.hero.y = lastClone.y;
        removeObjectFromArea(state, lastClone);
    } else {
        // If a non-hero clone is destroyed we just remove it from the array of clones.
        const index = state.hero.clones.indexOf(clone as any);
        if (index >= 0) {
            state.hero.clones.splice(index, 1);
        }
        removeObjectFromArea(state, clone);
    }
    // If the active clone is destroyed, we return control to the main hero.
    if (state.hero.activeClone === clone) {
        state.hero.activeClone = null;
    }
}
