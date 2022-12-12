import { enterZoneByTarget, playAreaSound, resetTileBehavior } from 'app/content/areas';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { getTileBehaviors } from 'app/utils/field';
import { isObjectInsideTarget, pad } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, Rect, EntranceDefinition, TileBehaviors,
} from 'app/types';

const pitFrame = createAnimation('gfx/tiles/pit.png', {w: 16, h: 16}).frames[0];

export const pitStyles: {[key: string]: {getHitbox: (pit: PitEntrance) => Rect}} = {
    default: {
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        }
    },
    singleTile: {
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 16, h: 16};
        }
    },
};

export class PitEntrance implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    behaviors: TileBehaviors = {pit: true};
    isObject = <const>true;
    x: number;
    ignorePits = true;
    y: number;
    status: ObjectStatus = 'normal';
    style: string;
    wasUnderObject: boolean;
    constructor(definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        this.style = this.definition.style || 'default';
    }
    getHitbox(): Rect {
        return pitStyles[this.style].getHitbox(this);
    }
    isUnderObject(state: GameState): boolean {
        if (!this.area || this.style !== 'singleTile') {
            return false;
        }
        const {tileBehavior} = getTileBehaviors(state, this.area, {x: this.x + 8, y: this.y + 8});
        return tileBehavior.solid || tileBehavior.covered;
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        if (this.isUnderObject(state)) {
            this.wasUnderObject = true;
            return;
        } else if (this.wasUnderObject) {
            this.wasUnderObject = false;
            // Play the secret chime when this pit is first discovered if it is actually an entrance.
            if (this.definition.targetZone, this.definition.targetObjectId) {
                playAreaSound(state, this.area, 'secretChime');
            }
        }
        const hero = state.hero;
        if (this.area === hero.area && hero.z <= 0  && hero.action !== 'roll'
            && isObjectInsideTarget(hero.getHitbox(), pad(this.getHitbox(), 2))
        ) {
            if (hero.action === 'fallen') {
                if (enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false)) {
                    hero.action = 'knocked';
                    hero.animationTime = 0;
                    hero.z = CANVAS_HEIGHT;
                    hero.vx = hero.vy = 0;
                    hero.vz = -1;
                    hero.safeD = hero.d;
                    hero.safeX = hero.x;
                    hero.safeY = hero.y;
                }
            } else if (hero.action !== 'falling') {
                hero.throwHeldObject(state);
                hero.heldChakram?.throw(state);
                hero.action = 'falling';
                hero.animationTime = 0;
            }
        }
    }
    changeStatus(state: GameState, status: ObjectStatus) {
        this.status = status;
        /*const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        if (this.status === 'normal') {
            const pitBehaviors: TileBehaviors = {solid: false, solidMap: null, pit: true };
            applyBehaviorToTile(this.area, x, y, pitBehaviors);
            applyBehaviorToTile(this.area, x, y + 1, pitBehaviors);
            applyBehaviorToTile(this.area, x + 1, y, pitBehaviors);
            applyBehaviorToTile(this.area, x + 1, y + 1, pitBehaviors);
        } else {
            resetTileBehavior(this.area, {x, y});
            resetTileBehavior(this.area, {x: x + 1, y});
            resetTileBehavior(this.area, {x: x, y: y + 1});
            resetTileBehavior(this.area, {x: x + 1, y: y + 1});
        }*/
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        this.changeStatus(state, this.status);
    }
    remove(state: GameState) {
        const index = this.area.objects.indexOf(this);
        if (index >= 0) {
            this.area.objects.splice(index, 1);
        }
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        resetTileBehavior(this.area, {x, y});
        resetTileBehavior(this.area, {x: x + 1, y});
        resetTileBehavior(this.area, {x: x, y: y + 1});
        resetTileBehavior(this.area, {x: x + 1, y: y + 1});
        this.area = null;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' || this.isUnderObject(state)) {
            return;
        }
        drawFrame(context, pitFrame, this.getHitbox());
    }
}
