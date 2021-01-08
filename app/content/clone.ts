//import { getAreaSize } from 'app/content/areas';
//import { GAME_KEY, getMovementDeltas, isKeyDown } from 'app/keyCommands';
import { renderHero } from 'app/renderActor';
//import { moveActor } from 'app/moveActor';
//import { getFrame } from 'app/utils/animations';

import {
    Action, ActiveTool,
    Direction, DrawPriority, MagicElement, Equipment, Frame,
    GameState, Hero, ObjectInstance, ObjectStatus, PassiveTool,
    Tile
} from 'app/types';

export class Clone implements Hero, ObjectInstance {
    definition = null;
    drawPriority: DrawPriority = 'sprites';
    frame: Frame;
    element: MagicElement;
    life: number;
    x: number;
    y: number;
    z: number;
    safeX: number;
    safeY: number;
    vx: number;
    vy: number;
    vz: number;
    w: number;
    h: number;
    d: Direction;
    arrows: number;
    peachQuarters: number;
    magic: number;
    magicRegen: number;
    money: number;
    maxLife: number;
    maxMagic: number;
    spiritTokens: number;
    toolCooldown: number;
    activeTools: {[key in ActiveTool]: number};
    equipment: {[key in Equipment]: number};
    passiveTools: {[key in PassiveTool]: number};
    elements: {[key in MagicElement]: number};
    activeClone: Clone;
    clones: Clone[]
    stuckFrames: number = 0;
    status: ObjectStatus = 'normal';
    animationTime: number = 0;
    action: Action;
    actionDx: number;
    actionDy: number;
    actionFrame: number;
    pickUpFrame: number;
    pickUpTile: Tile;
    grabTile: Tile;
    grabObject: ObjectInstance;
    invulnerableFrames: number;
    leftTool: ActiveTool;
    rightTool: ActiveTool;
    invisibilityCost: number;
    invisible: boolean;
    constructor(hero: Hero) {
        for (let k in hero) {
            this[k] = hero[k];
        }
    }
    update(state: GameState) {
        // You must have the clone tool button pressed to move the clone.
        /*if ((state.hero.leftTool === 'clone' && !isKeyDown(GAME_KEY.LEFT_TOOL)) ||
            (state.hero.rightTool === 'clone' && !isKeyDown(GAME_KEY.RIGHT_TOOL))) {
            return;
        }
        let dx = 0, dy = 0;
        let movementSpeed = 2;
        if (movementSpeed) {
            [dx, dy] = getMovementDeltas();
            if (dx || dy) {
                const m = Math.sqrt(dx * dx + dy * dy);
                dx = movementSpeed * dx / m;
                dy = movementSpeed * dy / m;
                if (dx < 0 && (this.d === 'right' || Math.abs(dx) > Math.abs(dy))) {
                    this.d = 'left';
                } else if (dx > 0 && (this.d === 'left' || Math.abs(dx) > Math.abs(dy))) {
                    this.d = 'right';
                } else if (dy < 0 && (this.d === 'down' || Math.abs(dy) > Math.abs(dx))) {
                    this.d = 'up';
                } else if (dy > 0 && (this.d === 'up' || Math.abs(dy) > Math.abs(dx))) {
                    this.d = 'down';
                }
            }
        }
        if (dx || dy) {
            moveActor(state, this, dx, dy, true);
        }
        const { section } = getAreaSize(state);
        // Remove the clone if it goes outside of the current section.
        if (this.x < section.x || this.x + this.w > section.x + section.w
            || this.y < section.y || this.y + this.h > section.y + section.h
            ){
            this.remove(state);
        }*/
    }
    remove(state: GameState): void {
        state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
    }
    render(context, state: GameState) {
        renderHero(context, state, this);
    }
}
