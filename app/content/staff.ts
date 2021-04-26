import { createAnimation, drawFrame } from 'app/utils/animations';
import { isPointOpen } from 'app/utils/field';

import { AreaInstance, Direction, MagicElement, Frame, GameState, ObjectInstance, ObjectStatus, TileBehaviors } from 'app/types';

const tilesFrame = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames[0];
export const normalFrame: Frame = {image: tilesFrame.image, x: 16 * 0, y: 16 * 35, w: 16, h: 16};
const leftFrame: Frame = {image: tilesFrame.image, x: 16 * 12, y: 16 * 15, w: 16, h: 16};
const horizontalFrame: Frame = {image: tilesFrame.image, x: 16 * 13, y: 16 * 15, w: 16, h: 16};
const rightFrame: Frame = {image: tilesFrame.image, x: 16 * 14, y: 16 * 15, w: 16, h: 16};

const topFrame: Frame = {image: tilesFrame.image, x: 16 * 15, y: 16 * 12, w: 16, h: 16};
const verticalFrame: Frame = {image: tilesFrame.image, x: 16 * 15, y: 16 * 13, w: 16, h: 16};
const bottomFrame: Frame = {image: tilesFrame.image, x: 16 * 15, y: 16 * 14, w: 16, h: 16};

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
    x: number;
    y: number;
    invalid: boolean;
    topRow: number;
    bottomRow: number;
    leftColumn: number;
    rightColumn: number;
    damage;
    status: ObjectStatus = 'normal';
    direction: Direction;
    element: MagicElement;
    storedBehaviors: TileBehaviors[][];
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
        const excludedObjects = new Set([state.hero]);
        if (!isPointOpen(state, this.area, {x: column * 16 + 8, y: row * 16 + 8 }, excludedObjects)) {
            this.invalid = true;
            return;
        }

        if (direction === 'left') {
            for (let i = 1; i < maxLength; i++) {
                column = this.rightColumn - i;
                if (!isPointOpen(state, this.area, {x: column * 16 + 8, y: row * 16 + 8 }, excludedObjects)) {
                    break;
                }
                this.leftColumn = column;
            }
        }else if (direction === 'right') {
            for (let i = 1; i < maxLength; i++) {
                column = this.leftColumn + i;
                if (!isPointOpen(state, this.area, {x: column * 16 + 8, y: row * 16 + 8 }, excludedObjects)) {
                    break;
                }
                this.rightColumn = column;
            }
        } else if (direction === 'up') {
            for (let i = 1; i < maxLength; i++) {
                row = this.bottomRow - i;
                if (!isPointOpen(state, this.area, {x: column * 16 + 8, y: row * 16 + 8 }, excludedObjects)) {
                    break;
                }
                this.topRow = row;
            }
        } else if (direction === 'down') {
            for (let i = 1; i < maxLength; i++) {
                row = this.topRow + i;
                if (!isPointOpen(state, this.area, {x: column * 16 + 8, y: row * 16 + 8 }, excludedObjects)) {
                    break;
                }
                this.bottomRow = row;
            }
        }
        // Store the behaviors on the staff as we delete them, the staff turns all covered tiles
        // into open ground.
        this.storedBehaviors = [];
        for (row = this.topRow; row <= this.bottomRow; row++) {
            this.storedBehaviors[row] = []
            for (column = this.leftColumn; column <= this.rightColumn; column++) {
                this.storedBehaviors[row][column] = state.areaInstance.behaviorGrid[row][column];
                state.areaInstance.behaviorGrid[row][column] = null;
            }
        }
        if (direction === 'left' || direction === 'right') {
            row = this.topRow;
            for (column = this.leftColumn; column <= this.rightColumn; column++) {
                let frame = horizontalFrame;
                if (column === this.leftColumn) {
                    frame = leftFrame;
                } else if (column === this.rightColumn) {
                    frame = rightFrame;
                }
                drawFrame(state.areaInstance.context, frame, {...frame, x: column * 16, y: row * 16});
            }
        }
        if (direction === 'up' || direction === 'down') {
            column = this.leftColumn;
            for (row = this.topRow; row <= this.bottomRow; row++) {
                let frame = verticalFrame;
                if (row === this.topRow) {
                    frame = topFrame;
                } else if (row === this.bottomRow) {
                    frame = bottomFrame;
                }
                drawFrame(state.areaInstance.context, frame, {...frame, x: column * 16, y: row * 16});
            }
        }
    }
    update(state: GameState) {
    }
    remove(state: GameState) {
        const index = this.area.objects.indexOf(this);
        if (index >= 0){
            this.area.objects.splice(index, 1);
        }
        // Restore the original tiles under the staff.
        for (let row = this.topRow; row <= this.bottomRow; row++) {
            for (let column = this.leftColumn; column <= this.rightColumn; column++) {
                // Indicate that the tiles need to be redrawn now that the staff is gone.
                this.area.tilesDrawn[row][column] = false;
                this.area.behaviorGrid[row][column] = this.storedBehaviors[row][column];
            }
        }
        this.area.checkToRedrawTiles = true;
        state.hero.activeStaff = null;
    }
    render(context, state: GameState) {
        // Nothing to render here, the staff is rendered to the background when it is placed.
        // Eventually this might render the animation of the staff being placed, which would require
        // updating the tiles at the end of the animation instead of on creation.
    }
}
