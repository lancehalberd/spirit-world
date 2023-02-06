import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { debugCanvas } from 'app/utils/canvas';
import { isTileOpen } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';

import { AreaInstance, Direction, DrawPriority, Hero, MagicElement, GameState, ObjectInstance, ObjectStatus, TileBehaviors } from 'app/types';

const staffPartGeometry = {w: 20, h: 17};
const leftAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 0, y: 3, rows: 3, frameMap: [2, 1,0], duration: 3}, {loop: false});
const horizontalAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 1, y: 3, rows: 3, frameMap: [2, 1,0], duration: 3}, {loop: false});
const rightAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 2, y: 3, rows: 3, frameMap: [2, 1,0], duration: 3}, {loop: false});
const topAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 0, y: 0, rows: 3, frameMap: [1, 2,0], duration: 3}, {loop: false});
const verticalAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 1, y: 0, rows: 3, frameMap: [1, 2,0], duration: 3}, {loop: false});
const bottomAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 2, y: 0, rows: 3, frameMap: [1, 2,0], duration: 3}, {loop: false});
debugCanvas;//(leftAnimation.frames[0]);

interface Props {
    x?: number
    y?: number,
    damage?: number,
    direction: Direction,
    element: MagicElement,
    maxLength: number,
}

export class Staff implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    canPressSwitches = true;
    drawPriority: DrawPriority = 'background';
    x: number;
    y: number;
    ignorePits = true;
    invalid: boolean;
    isObject = <const>true;
    topRow: number;
    bottomRow: number;
    leftColumn: number;
    rightColumn: number;
    damage;
    status: ObjectStatus = 'normal';
    direction: Direction;
    element: MagicElement;
    storedBehaviors: TileBehaviors[][];
    animationTime: number = 0;
    recalling: boolean = false;
    // Used to track which hero to assign this staff to if it is switched to a new area.
    hero: Hero;
    constructor(state: GameState, { x = 0, y = 0, damage = 1, direction, element, maxLength = 4 }: Props) {
        // Note this assumes the staff is always added to the area the hero is in.
        this.area = state.areaInstance;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.element = element;
        this.damage = damage;
        let row = this.topRow = this.bottomRow = Math.floor(y / 16);
        let column = this.leftColumn = this.rightColumn = Math.floor(x / 16);
        const movementProps = {canFall: true, canSwim: true};
        const tileBehavior = this.area?.behaviorGrid[row]?.[column];
        if (tileBehavior?.solid || tileBehavior?.solidMap || tileBehavior?.ledges) {
            this.invalid = true;
            return;
        }
        if (!isTileOpen(state, this.area, {x: column * 16, y: row * 16 }, movementProps)) {
            this.invalid = true;
            return;
        }
        const { section } = getAreaSize(state);
        if (direction === 'left') {
            for (let i = 1; i < maxLength; i++) {
                column = this.rightColumn - i;
                const tileBehavior = this.area?.behaviorGrid[row]?.[column];
                if (column * 16 < section.x || tileBehavior?.solid || tileBehavior?.solidMap || tileBehavior?.diagonalLedge || tileBehavior?.blocksStaff) {
                    break;
                }
                if (!isTileOpen(state, this.area, {x: column * 16, y: row * 16 }, movementProps)) {
                    break;
                }
                this.leftColumn = column;
            }
        }else if (direction === 'right') {
            for (let i = 1; i < maxLength; i++) {
                column = this.leftColumn + i;
                const tileBehavior = this.area?.behaviorGrid[row]?.[column];
                if (column * 16 >= section.x + section.w || tileBehavior?.solid || tileBehavior?.solidMap || tileBehavior?.diagonalLedge || tileBehavior?.blocksStaff) {
                    break;
                }
                if (!isTileOpen(state, this.area, {x: column * 16, y: row * 16 }, movementProps)) {
                    break;
                }
                this.rightColumn = column;
            }
        } else if (direction === 'up') {
            for (let i = 1; i < maxLength; i++) {
                row = this.bottomRow - i;
                const tileBehavior = this.area?.behaviorGrid[row]?.[column];
                if (row * 16 < section.y || tileBehavior?.solid || tileBehavior?.solidMap || tileBehavior?.diagonalLedge || tileBehavior?.blocksStaff) {
                    break;
                }
                if (!isTileOpen(state, this.area, {x: column * 16, y: row * 16 }, movementProps)) {
                    break;
                }
                this.topRow = row;
            }
        } else if (direction === 'down') {
            for (let i = 1; i < maxLength; i++) {
                row = this.topRow + i;
                const tileBehavior = this.area?.behaviorGrid[row]?.[column];
                if (row * 16 >= section.y + section.h || tileBehavior?.solid || tileBehavior?.solidMap || tileBehavior?.diagonalLedge || tileBehavior?.blocksStaff) {
                    break;
                }
                if (!isTileOpen(state, this.area, {x: column * 16, y: row * 16 }, movementProps)) {
                    break;
                }
                this.bottomRow = row;
            }
        }
        if (this.rightColumn - this.leftColumn < 2 && this.bottomRow - this.topRow < 2) {
            this.invalid = true;
        }
    }
    getHitbox(state: GameState) {
        return {
            x: this.leftColumn * 16, y: this.topRow * 16,
            w: (this.rightColumn - this.leftColumn + 1) * 16,
            h: (this.bottomRow - this.topRow + 1) * 16,
        };
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        // Store the behaviors on the staff as we delete them, the staff turns all covered tiles
        // into open ground.
        this.storedBehaviors = [];
        for (let row = this.topRow; row <= this.bottomRow; row++) {
            this.storedBehaviors[row] = []
            for (let column = this.leftColumn; column <= this.rightColumn; column++) {
                this.storedBehaviors[row][column] = state.areaInstance.behaviorGrid[row][column];
                state.areaInstance.behaviorGrid[row][column] = { groundHeight: 2, blocksStaff: true };
            }
        }
        // Restore this staff to the hero if it was moved from one area to another, for example
        // when refreshing logic for the current area.
        if (this.hero) {
            this.hero.activeStaff = this;
        }
    }
    recall(state: GameState) {
        this.recalling = true;
        this.animationTime = leftAnimation.duration;
    }
    update(state: GameState) {
        if (this.recalling) {
            this.animationTime -= FRAME_LENGTH;
            if (this.animationTime <= 0) {
                this.remove(state);
            }
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.invalid && this.animationTime > 100) {
            this.remove(state);
        }
    }
    remove(state: GameState) {
        const index = this.area.objects.indexOf(this);
        if (index >= 0){
            this.area.objects.splice(index, 1);
        }
        // Restore the original tiles under the staff.
        for (let row = this.topRow; row <= this.bottomRow; row++) {
            for (let column = this.leftColumn; column <= this.rightColumn; column++) {
                this.area.behaviorGrid[row][column] = this.storedBehaviors[row][column];
            }
        }
        for (const hero of [state.hero, ...state.hero.clones]) {
            if (hero.activeStaff === this) {
                this.hero = hero;
                delete hero.activeStaff;
            }
        }
    }
    render(context, state: GameState) {
        if (this.direction === 'left' || this.direction === 'right') {
            let frame = getFrame(leftAnimation, this.animationTime);
            const y = this.topRow * 16 - 1;
            drawFrame(context, frame, {...frame, x: this.leftColumn * 16 - 2, y});
            const length = this.rightColumn - this.leftColumn - 1;
            if (length > 0) {
                frame = getFrame(horizontalAnimation, this.animationTime);
                // This frame is 16px center in 20px space, but we need the exact rectangle to stretch it correctly.
                drawFrame(context, {...frame, x: frame.x + 2, w: 16}, {...frame, x: this.leftColumn * 16 + 16, y, w: length * 16});
            }
            frame = getFrame(rightAnimation, this.animationTime);
            drawFrame(context, frame, {...frame, x: this.rightColumn * 16 - 2, y});
        } else {
            let frame = getFrame(topAnimation, this.animationTime);
            const x = this.leftColumn * 16 - 2;
            drawFrame(context, frame, {...frame, x, y: this.topRow * 16 - 1});
            const length = this.bottomRow - this.topRow - 1;
            if (length > 0) {
                frame = getFrame(verticalAnimation, this.animationTime);
                // This frame is 16px offset by 1px in 17px space, but we need the exact rectangle to stretch it correctly.
                drawFrame(context, {...frame, y: frame.y + 1, h: 16}, {...frame, x, y: this.topRow * 16 + 16, h: length * 16});
            }
            frame = getFrame(bottomAnimation, this.animationTime);
            drawFrame(context, frame, {...frame, x, y: this.bottomRow * 16 - 1});
        }
    }
}
