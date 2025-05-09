import {FRAME_LENGTH} from 'app/gameConstants';
import {getSectionBoundingBox} from 'app/movement/moveActor';
import {moveObject} from 'app/movement/moveObject';
import {createAnimation, drawFrame, getFrame} from 'app/utils/animations';
import {directionMap} from 'app/utils/direction';
import {getTilesInRectangle} from 'app/utils/field';
import {pad, rectanglesOverlap} from 'app/utils/index';
import {getObjectBehaviors} from 'app/utils/objects';

interface StaffAnimations {
    left: FrameAnimation
    horizontal: FrameAnimation
    right: FrameAnimation
    top: FrameAnimation
    vertical: FrameAnimation
    bottom: FrameAnimation
    horizontalDetails: FrameAnimation[]
    verticalDetails: FrameAnimation[]
}

const staffPartGeometry = {w: 20, h: 17};
function createStaffAnimations(source: string, details = 0): StaffAnimations {
    const horizontalDetails: FrameAnimation[] = [];
    const verticalDetails: FrameAnimation[] = [];
    for (let i = 0; i < details; i++) {
        horizontalDetails.push(createAnimation(source, staffPartGeometry, {x: 3 + i, y: 3, rows: 3, frameMap: [2, 1, 0], duration: 3}, {loop: false}));
        verticalDetails.push(createAnimation(source, staffPartGeometry, {x: 3 + i, y: 0, rows: 3, frameMap: [1, 2, 0], duration: 3}, {loop: false}));
    }
    return {
        left: createAnimation(source, staffPartGeometry, {x: 0, y: 3, rows: 3, frameMap: [2, 1, 0], duration: 3}, {loop: false}),
        horizontal: createAnimation(source, staffPartGeometry, {x: 1, y: 3, rows: 3, frameMap: [2, 1, 0], duration: 3}, {loop: false}),
        right: createAnimation(source, staffPartGeometry, {x: 2, y: 3, rows: 3, frameMap: [2, 1, 0], duration: 3}, {loop: false}),
        top: createAnimation(source, staffPartGeometry, {x: 0, y: 0, rows: 3, frameMap: [1, 2, 0], duration: 3}, {loop: false}),
        vertical: createAnimation(source, staffPartGeometry, {x: 1, y: 0, rows: 3, frameMap: [1, 2, 0], duration: 3}, {loop: false}),
        bottom: createAnimation(source, staffPartGeometry, {x: 2, y: 0, rows: 3, frameMap: [1, 2, 0], duration: 3}, {loop: false}),
        horizontalDetails,
        verticalDetails,
    };
}

const treeStaffAnimations = createStaffAnimations('gfx/effects/wukong_staff_parts.png');
const darkTowerStaffAnimations = createStaffAnimations('gfx/effects/wukong_staff_parts-dark.png', 2);
const lightTowerStaffAnimations = createStaffAnimations('gfx/effects/wukong_staff_parts-light.png', 2);

/*const leftAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 0, y: 3, rows: 3, frameMap: [2, 1,0], duration: 3}, {loop: false});
const horizontalAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 1, y: 3, rows: 3, frameMap: [2, 1,0], duration: 3}, {loop: false});
const rightAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 2, y: 3, rows: 3, frameMap: [2, 1,0], duration: 3}, {loop: false});
const topAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 0, y: 0, rows: 3, frameMap: [1, 2,0], duration: 3}, {loop: false});
const verticalAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 1, y: 0, rows: 3, frameMap: [1, 2,0], duration: 3}, {loop: false});
const bottomAnimation = createAnimation('gfx/effects/wukong_staff_parts.png', staffPartGeometry, {x: 2, y: 0, rows: 3, frameMap: [1, 2,0], duration: 3}, {loop: false});
*/

interface Props {
    x?: number
    y?: number
    level: number
    damage?: number
    direction: Direction
    crushingPower: number
    element: MagicElement
    maxLength: number
}

export class Staff implements ObjectInstance {
    behaviors: TileBehaviors = {
        groundHeight: 2,
    };
    area: AreaInstance;
    canPressSwitches = true;
    drawPriority: DrawPriority = 'background';
    drawPriorityIndex = 3;
    x: number;
    y: number;
    w: number = 16;
    h: number = 16;
    ignorePits = true;
    isInvalid: boolean;
    staffBonked: boolean;
    isObject = <const>true;
    damage: number;
    status: ObjectStatus = 'normal';
    direction: Direction;
    element: MagicElement;
    storedBehaviors: TileBehaviors[][];
    animationTime: number = 0;
    recalling: boolean = false;
    animations: StaffAnimations;
    // Used to track which hero to assign this staff to if it is switched to a new area.
    hero: Hero;
    constructor(state: GameState, { x = 0, y = 0, damage = 1, direction, element, maxLength = 4, level = 1, crushingPower }: Props) {
        // Note this assumes the staff is always added to the area the hero is in.
        this.area = state.areaInstance;
        this.animations = treeStaffAnimations;
        if (level > 1) {
            this.animations = this.area.definition.isSpiritWorld ? lightTowerStaffAnimations : darkTowerStaffAnimations;
        }
        x = x | 0;
        y = y | 0;
        this.direction = direction;
        this.w = 16;
        this.h = 16;
        // Slight adjustments are made to the dimensions of the staff depending on the direction in order
        // for the graphic to match its hitbox.
        if (direction === 'left' || direction === 'right') {
            y += 5;
            // This is the sized used for determining placement, the final size will be smaller.
            this.h = 12;
        } else {
            x += 4;
            // This is the sized used for determining placement, the final size will be smaller.
            this.w = 12;
        }
        // Since the player's feet appear low in their tile, plant the staff several pixels further south when placing it in
        // the up direction so there is not a large gap between the staff hitbox and the players feet.
        // Otherwise if the player stands on the southern edge of a pit and places the staff, they may create a gap that is big
        // enough for them to fall into when trying to walk onto the staff.
        if (this.direction === 'up') {
            y += 8;
        } else if (this.direction === 'left') {
            x += 2;
        } else if (this.direction === 'right') {
            x -= 2;
        }
        this.x = x;
        this.y = y;
        this.element = element;
        this.damage = damage;
        const dx = 4 * directionMap[direction][0];
        const dy = 4 * directionMap[direction][1];
        const movementProperties: MovementProperties = {
            boundingBox: getSectionBoundingBox(state, this),
            blockedBoxes: this.area.objects.filter(o => o.definition?.type === 'ballGoal').map(o => o.getHitbox()),
            canFall: true, canSwim: true,
            canMoveInLava: true,
            canWiggle: true, dx, dy,
            crushingPower,
        };
        for (let i = 0; i < maxLength * 4; i++) {
            const {mx, my} = moveObject(state, this, dx, dy, movementProperties);
            if (!mx && !my) {
                break;
            }
            // If the staff is more than 4 pixels off in both dimensions it means it has wiggled more than 4px
            // which is the max we allow, so we remove all wiggles.
            if (Math.abs(this.x - x) > 4 && Math.abs(this.y - y) > 4) {
                if (this.direction === 'left' || this.direction === 'right') {
                    this.y = y;
                } else {
                    this.x = x;
                }
                break;
            }
        }
        if (direction === 'left' && x - this.x >= 40) {
            this.w = x - this.x;
        } else if (direction === 'right' && this.x - x >= 40) {
            this.w = this.x - x;
            this.x = x + 16;
        } else if (direction === 'up' && y - this.y >= 40) {
            this.h = y - this.y;
        } else if (direction === 'down' && this.y - y >= 40) {
            this.h = this.y - y;
            this.y = y + 16;
        } else {
            this.staffBonked = Math.abs(this.y - y) <= 24 && Math.abs(this.x - x) <= 24;
            this.isInvalid = true;
        }
        // Make the hitbox even shorter when horizontal because the player's vertical hitbox is so large
        // it isn't intuitive otherwise. We don't do this earlier because otherwise the staff can appear
        // to lay on top of tiles since the graphics are so much larger than its hitbox.
        if (direction === 'left' || direction === 'right') {
            this.h = 12;
        } else {
            //this.w = 8;
        }
    }
    getHitbox() {
        return this;
    }
    getAttackHitbox() {
        return pad(this, 4);
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        // Restore this staff to the hero if it was moved from one area to another, for example
        // when refreshing logic for the current area.
        if (this.hero) {
            this.hero.activeStaff = this;
        }
    }
    recall(state: GameState) {
        this.recalling = true;
        this.animationTime = this.animations.left.duration;
    }
    update(state: GameState) {
        if (this.recalling) {
            this.animationTime -= FRAME_LENGTH;
            if (this.animationTime <= 0) {
                this.remove(state);
            }
            return;
        } else if (state.hero.savedData.leftTool !== 'staff' && state.hero.savedData.rightTool !== 'staff') {
            // Staff automatically recalls if it is unequipped.
            this.recall(state);
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.isInvalid && this.animationTime > 100) {
            this.remove(state);
            return;
        }
        // Check if the staff should be recalled because it is completely over pits.
        if (this.isUnsupported(state)) {
            this.recall(state);
            return;
        }
    }
    isUnsupported(state: GameState): boolean {
        const behaviorGrid = this.area.behaviorGrid;
        const hitbox = this.getHitbox()
        // The staff is supported as long as there is at least one non pit tile under it.
        for (const {x, y} of getTilesInRectangle(this.area, hitbox)) {
            let behaviors = behaviorGrid[y]?.[x];
            if (!behaviors?.pit) {
                return false;
            }
        }
        // The staff is also supported as long as there is a ground object under it.
        for (const object of this.area.allActiveObjects) {
            if (object === this || !object.getHitbox) {
                continue;
            }
            if (!rectanglesOverlap(hitbox, object.getHitbox())) {
                continue;
            }
            const behaviors = getObjectBehaviors(state, object);
            if (behaviors?.isGround || behaviors?.groundHeight > 0) {
                return false;
            }
        }
        return true;
    }
    remove(state: GameState) {
        const index = this.area.objects.indexOf(this);
        if (index >= 0){
            this.area.objects.splice(index, 1);
        }
        for (const hero of [state.hero, ...state.hero.clones]) {
            if (hero.activeStaff === this) {
                this.hero = hero;
                delete hero.activeStaff;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        //context.fillStyle = 'red';
        //const attackHitbox = this.getAttackHitbox();
        //context.fillRect(attackHitbox.x, attackHitbox.y, attackHitbox.w, attackHitbox.h);
        context.save();
            if (state.hero.activeStaff !== this) {
                context.globalAlpha *= 0.6;
            }
            let x = this.x | 0, y = this.y | 0;
            if (this.direction === 'left' || this.direction === 'right') {
                //x -= 3;
                let frame = getFrame(this.animations.left, this.animationTime);
                y -= 3;
                drawFrame(context, frame, {...frame, x: x - 2, y});
                const w = this.w - 32;
                if (w > 0) {
                    frame = getFrame(this.animations.horizontal, this.animationTime);
                    // This frame is 16px center in 20px space, but we need the exact rectangle to stretch it correctly.
                    drawFrame(context, {...frame, x: frame.x + 2, w: 16}, {...frame, x: x + 16, y, w});
                }
                frame = getFrame(this.animations.right, this.animationTime);
                drawFrame(context, frame, {...frame, x: x + this.w - 18, y});
                for (let i = 0; i < this.animations.horizontalDetails.length; i++) {
                    frame = getFrame(this.animations.horizontalDetails[i], this.animationTime);
                    drawFrame(context, frame, {...frame, x: x + Math.min(16 + this.w / 2 * i, this.w - 32), y});
                }
            } else {
                y -= 4;
                let frame = getFrame(this.animations.top, this.animationTime);
                x -= 4;
                drawFrame(context, frame, {...frame, x, y: y});
                const h = this.h - 27;
                if (h > 0) {
                    frame = getFrame(this.animations.vertical, this.animationTime);
                    // This frame is 16px offset by 1px in 17px space, but we need the exact rectangle to stretch it correctly.
                    drawFrame(context, {...frame, y: frame.y + 1, h: 16}, {...frame, x, y: y + 17, h});
                }
                frame = getFrame(this.animations.bottom, this.animationTime);
                drawFrame(context, frame, {...frame, x, y: y + this.h - 11});
                for (let i = 0; i < this.animations.verticalDetails.length; i++) {
                    frame = getFrame(this.animations.verticalDetails[i], this.animationTime);
                    drawFrame(context, frame, {...frame, x, y: y + Math.min(16 + this.h / 2 * i, this.h - 32)});
                }
            }
        context.restore();
        /*context.save();
            context.globalAlpha *= 0.6;
            context.fillStyle = 'blue';
            context.fillRect(this.x, this.y, this.w, this.h);
        context.restore();*/
    }
}
