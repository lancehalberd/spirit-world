import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrameContentAt, getFrameHitbox } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { allImagesLoaded } from 'app/utils/images';
import { isPixelInShortRect } from 'app/utils/index';
import { requireFrame } from 'app/utils/packedImages';

//const staffTowerFrame = requireFrame('gfx/objects/staffTower.png', {x: 26, y: 17, w: 172, h: 239, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 17, w: 172, h: 241, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerMaskFrame = requireFrame('gfx/objects/staffTower.png', {x: 442, y: 17, w: 172, h: 241, content: {x: 0, y: 72, w: 172, h: 167}});

const staffTowerCloudFrame = requireFrame('gfx/objects/staffTower.png', {x: 851, y: 266, w: 186, h: 141});

//const staffTowerSkyFrame = requireFrame('gfx/objects/staffTower.png', {x: 26, y: 273, w: 172, h: 239, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSkyFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 273, w: 172, h: 241, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSkyMaskFrame = requireFrame('gfx/objects/staffTower.png', {x: 442, y: 273, w: 172, h: 272, content: {x: 0, y: 72, w: 172, h: 167}});

const staffTowerSkyBalconyFrame = requireFrame('gfx/objects/staffTower.png', {x: 672, y: 493, w: 128, h: 82});
const staffTowerSkyBottomFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 612, w: 172, h: 93});
// TODO: Update entrance randomizer to treat 'staffTower' objects like doors.
// TODO: Fix MC renders over the door frame when exiting the tower.
//       Remove the "doorTop" as a separate component.
//       If the hero is using the door, set the door as the renderParent, and then render the door top after them.
// TOOO: Add terminal as tower part on the ground level and use it to tear down+setup tower.
export class StaffTower implements ObjectInstance {
    area: AreaInstance;
    definition: EntranceDefinition;
    drawPriority: DrawPriority = 'sprites';
    isObject = <const>true;
    ignorePits = true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    door: ObjectInstance;
    balcony: Balcony;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.door = createObjectInstance(state, {
            type: 'door',
            id: definition.id,
            status: definition.status,
            d: 'up',
            style: 'future',
            x: this.x + 70,
            y: this.y + 138,
            targetZone: definition.targetZone,
            targetObjectId: definition.targetObjectId,
        });
        // Door's normally render on the background layer, but this door must render on top of the tower, which is in the sprite layer.
        this.door.renderParent = this;
        this.balcony = new Balcony(this);
    }
    getParts() {
        const parts = [this.door];
        if (this.definition.style === 'sky') {
            parts.push(this.balcony);
        }
        return parts;
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        const hitbox = this.getHitbox();
        if (!isPixelInShortRect(x, y, hitbox)) {
            return {};
        }
        const radius = 82;
        // TODO: make this an ellipse instead of a circle.
        const dx = x - (hitbox.x + hitbox.w / 2), dy = y - (hitbox.y + hitbox.h / 2);
        const r2 = dx*dx + dy*dy;
        // The ring around the elevator is solid
        if (r2 < radius * radius) {
            return {solid: true};
        }
        return {};
    }
    getYDepth(): number {
        const hitbox = this.getHitbox();
        return hitbox.y + hitbox.h - 57;
    }
    getHitbox(): Rect {;
        return getFrameHitbox(staffTowerFrame, this);
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        this.door.area = this.area;
        this.door.update(state);
    }
    renderForeground(context: CanvasRenderingContext2D, state: GameState) {
        if (this.definition.style === 'sky') {
            return;
        }
        drawFrameContentAt(context, staffTowerCloudFrame, {x: this.x - 8, y: this.y - 80});
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // TODO: Use this mask to draw composite effets for the tower lights.
        // Matt grey or black when the tower is off.
        // shifting patterns of white and blue when it is on.
        if (this.definition.style === 'sky') {
            // drawFrameContentAt(context, staffTowerSkyMaskFrame, this);
            drawFrameContentAt(context, staffTowerSkyFrame, this);
        } else {
            drawFrameContentAt(context, staffTowerMaskFrame, this);
            drawFrameContentAt(context, staffTowerFrame, this);
        }
        this.door.render(context, state);
    }
}

const [/*balconyCanvas*/, balconyContext] = createCanvasAndContext(staffTowerSkyBalconyFrame.w, staffTowerSkyBalconyFrame.h)
const createHorizontalBelt = async () => {
    await allImagesLoaded();
    drawFrameContentAt(balconyContext, staffTowerSkyBalconyFrame, {x: 0, y: 0});
}
createHorizontalBelt();
//window["debugCanvas"](balconyCanvas, 2);


export class Balcony implements ObjectInstance {
    get area(): AreaInstance {
        return this.staffTower.area;
    }
    drawPriority: 'background' = 'background';
    status: ObjectStatus;
    x: number = this.staffTower.x + 22;
    y: number = this.staffTower.y + 149;
    ignorePits = true;
    isObject = <const>true;
    constructor(public staffTower: StaffTower) {}
    getHitbox(): Rect {
        return getFrameHitbox(staffTowerSkyBalconyFrame, this);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameContentAt(context, staffTowerSkyMaskFrame, this.staffTower);
        drawFrameContentAt(context, staffTowerSkyBottomFrame, {x: this.staffTower.x, y: this.staffTower.y + 106});
        drawFrameContentAt(context, staffTowerSkyBalconyFrame, this);
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        if (typeof x === 'undefined') {
            return {isGround: true, groundHeight: 1};
        }
        //console.log(x, y);
        //console.log(x - this.x, y -this.y, balconyContext.getImageData(x - this.x, y -this.y, 1, 1).data);
        const [r,/*g*/,/*b*/,alpha] = balconyContext.getImageData(x - this.x, y -this.y, 1, 1).data;
        //console.log(alpha);
        //console.log(r);
        if (alpha && r >= 203) {
            return {isGround: true, groundHeight: 1};
        }
        if (alpha) {
            return {pit: true, pitWall: true};
        }
        return {};
        //debugger;
        // TODO: if x+y are defined, base this all on pixel value of the balcony graphic
        // for the spirit world, which just contains the floor graphics (and not the soutern lip/edge of the balcony).
        const hitbox = this.getHitbox();
        // This prevents overriding the behavior of the tower+door, otherwise this would let you walk
        // through the tower+solid parts of the door.
        if (y < this.y + 22) {
            return {};
        }
        if (!isPixelInShortRect(x, y, hitbox)) {
            return {};
        }
        return {isGround: true, groundHeight: 1};
    }
}

objectHash.staffTower = StaffTower;
