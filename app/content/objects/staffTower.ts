import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame, drawFrameContentAt, getFrameHitbox } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { allImagesLoaded } from 'app/utils/images';
import { isPixelInShortRect } from 'app/utils/index';
import { requireFrame } from 'app/utils/packedImages';

const staffTowerFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 17, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerMaskFrame = requireFrame('gfx/objects/staffTower.png', {x: 442, y: 17, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerCloudFrame = requireFrame('gfx/objects/staffTower.png', {x: 851, y: 266, w: 186, h: 141});
const staffTowerSkyFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 273, w: 172, h: 272, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSkyMaskFrame = requireFrame('gfx/objects/staffTower.png', {x: 442, y: 273, w: 172, h: 272, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSkyBalconyFrame = requireFrame('gfx/objects/staffTower.png', {x: 672, y: 493, w: 128, h: 82});

const staffTowerSpiritFrame = requireFrame('gfx/objects/staffTower.png', {x: 26, y: 17, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSpiritMaskFrame = staffTowerMaskFrame;
const staffTowerSpiritSkyFrame = requireFrame('gfx/objects/staffTower.png', {x: 26, y: 273, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSpiritSkyMaskFrame = staffTowerMaskFrame;
const staffTowerSpiritSkyBalconyFrame = requireFrame('gfx/objects/staffTower.png', {x: 880, y: 493, w: 128, h: 75});

const [maskCanvas, maskContext] = createCanvasAndContext(staffTowerSkyMaskFrame.w, staffTowerSkyMaskFrame.h);
const [glowCanvas, glowContext] = createCanvasAndContext(staffTowerSkyMaskFrame.w, staffTowerSkyMaskFrame.h);

export class StaffTower implements ObjectInstance {
    area: AreaInstance;
    definition: EntranceDefinition;
    drawPriority: DrawPriority = 'sprites';
    isNeutralTarget = true;
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
        const r2 = dx * dx + dy * dy;
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
        if (this.definition.style === 'sky' || this.definition.spirit) {
            return;
        }
        drawFrameContentAt(context, staffTowerCloudFrame, {x: this.x - 8, y: this.y - 80});
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // TODO: Use this mask to draw composite effets for the tower lights.
        // Matt grey or black when the tower is off.
        // shifting patterns of white and blue when it is on.
        let maskFrame = staffTowerMaskFrame;
        if (this.definition.style === 'sky') {
            maskFrame = this.definition.spirit ? staffTowerSpiritSkyMaskFrame : staffTowerSkyMaskFrame;
        } else {
            maskFrame = this.definition.spirit ? staffTowerSpiritMaskFrame : staffTowerMaskFrame;
        }
        maskContext.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
        maskContext.globalCompositeOperation = 'source-over';
        drawFrame(maskContext, maskFrame, {...maskFrame, x: 0, y: 0});
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        //const towerIsHaywire = towerIsOn && !state.savedState.objectFlags.stormBeast;
        if (towerIsOn) {
            maskContext.globalCompositeOperation = 'source-in';

            // Just fade between white/black
            //let n = ((this.animationTime / 100) % 30) | 0;
            //if (n >= 15) n = 30 - n;
            //const c = '0123456789ABCDEF'[Math.floor(n)];
            //glowContext.fillStyle = `#${c}${c}${c}`;
            // Theses values are chosen so that the split is between distinct veins on the tower.
            const h = this.definition.style === 'sky' ? 111 : 117;

            for (let y = 90, i = 0; y < maskFrame.h; y += h, i++) {
                const backgroundColor = this.definition.spirit ? '#40A': 'black';

                const r = this.definition.spirit ? 40 : 40;
                let p = ((this.animationTime + 1000 * i) % 2000) / 2000;
                p = (1 - Math.cos(p * Math.PI)) / 2;
                const center = (maskFrame.w + r) * p;
                const gradient = glowContext.createLinearGradient(center - r, 0, center + r, 0);
                gradient.addColorStop(0, backgroundColor);
                // purple: '#A0F'
                gradient.addColorStop(0.5, this.definition.spirit ? '#FF4' : '#8FF');
                gradient.addColorStop(0.52, this.definition.spirit ? 'white': 'white');
                gradient.addColorStop(0.54, backgroundColor);
                glowContext.fillStyle = gradient;
                glowContext.beginPath();
                glowContext.fillRect(0, y, maskFrame.w, h);
            }
            drawFrame(maskContext, {...maskFrame, image: glowCanvas, x: 0, y: 0}, {...maskFrame, x: 0, y: 0});
        }
        drawFrameContentAt(context, {...maskFrame, image: maskCanvas, x: 0, y: 0}, this);
        //drawFrameContentAt(context, {...maskFrame, image: glowCanvas, x: 0, y: 0}, this);
        if (this.definition.style === 'sky') {
            if (this.definition.spirit) {
                drawFrameContentAt(context, staffTowerSpiritSkyFrame, this);
            } else {
                drawFrameContentAt(context, staffTowerSkyFrame, this);
            }
            this.balcony.render(context, state);
        } else {
            if (this.definition.spirit) {
                drawFrameContentAt(context, staffTowerSpiritFrame, this);
            } else {
                drawFrameContentAt(context, staffTowerFrame, this);
            }
        }
        this.door.render(context, state);
    }
}

const [/*balconyCanvas*/, balconyContext] = createCanvasAndContext(staffTowerSkyBalconyFrame.w, staffTowerSkyBalconyFrame.h);
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
    // Because the 'isGround' behavior ignores solid walls, this position has to be exact
    // to prevent the hero from being able to enter the door when it is closed.
    y: number = this.staffTower.y + 149;
    ignorePits = true;
    isObject = <const>true;
    renderParent = this.staffTower;
    constructor(public staffTower: StaffTower) {}
    getHitbox(): Rect {
        return getFrameHitbox(staffTowerSkyBalconyFrame, this);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.staffTower.definition.spirit) {
            drawFrameContentAt(context, staffTowerSpiritSkyBalconyFrame, this);
        } else {
            drawFrameContentAt(context, staffTowerSkyBalconyFrame, this);
        }
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        if (typeof x === 'undefined') {
            return {isGround: true, groundHeight: 1};
        }
        // If we have to adjust the graphics, we might use the below code to prevent moving through the tower
        // the exact number might need to be adjusted depending on the relative position of the balcony.
        // This prevents overriding the behavior of the tower+door, otherwise this would let you walk
        // through the tower+solid parts of the door.
        if (y < this.y + 22) {
            return {};
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
            if (this.staffTower.definition.spirit) {
                return {};
            }
            return {pit: true, pitWall: true};
        }
        return {};
    }
}

objectHash.staffTower = StaffTower;
