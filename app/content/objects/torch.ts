import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import SRandom from 'app/utils/SRandom';

import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';

const baseGeometry = {w: 16, h: 32, content: {x: 0, w: 16, y: 16, h : 16}};
const pitFireGeometry = {w: 16, h: 32, content: {x: 0, w: 16, y: 17, h : 16}};

const campFireAnimation = createAnimation('gfx/objects/torch.png', baseGeometry, {x: 1, y: 0, cols: 4});
const pitFireAnimation = createAnimation('gfx/objects/torch.png', pitFireGeometry, {x: 1, y: 0, cols: 4});
const torchFireAnimation = createAnimation('gfx/objects/torch.png', baseGeometry, {x: 1, y: 3, cols: 4});

export const torchStyles = {
    // Default style.
    torch: {
        baseAnimation: createAnimation('gfx/objects/torch.png', baseGeometry, {x: 0, y: 4, cols: 1}),
        flameAnimation: torchFireAnimation,
    },
    logs: {
        baseAnimation: createAnimation('gfx/objects/torch.png', baseGeometry, {x: 0, y: 1, cols: 1}),
        flameAnimation: campFireAnimation
    },
    firePit: {
        baseAnimation: createAnimation('gfx/objects/torch.png', baseGeometry, {x: 0, y: 2, cols: 1}),
        flameAnimation: pitFireAnimation,
    },
    bowl: {
        baseAnimation: createAnimation('gfx/objects/torch.png', baseGeometry, {x: 0, y: 6, cols: 1}),
        flameAnimation: torchFireAnimation,
    },
};


export class TorchFlame implements ObjectInstance {
    get area(): AreaInstance {
        return this.torch.area;
    }
    getLightSources(state: GameState): LightSource[] {
        const r = SRandom.seed(this.torch.animationTime).random();
        return [{
            x: this.x + 8,
            y: this.y + 4,
            //brightness: 0.8 + 0.05 * Math.sin(this.torch.animationTime / 150),
            brightness: 0.8 + 0.05 * r,
            radius: 40 + (2 * r - 1),
            color: {r:255, g: 0, b: 0},
        }];
    }
    drawPriority: 'sprites' = 'sprites';
    status: ObjectStatus;
    x = this.torch.x;
    y = this.torch.y;
    ignorePits = true;
    isObject = <const>true;
    constructor(public torch: Torch) {}
    getYDepth(): number {
       return this.y + 8;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const style = this.torch.getStyle();
        drawFrameAt(context, getFrame(style.flameAnimation, this.torch.animationTime), {
            x: this.x,
            y: this.y,
            w: 16,
            h: 16,
        });
    }
}

export class Torch implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors = {
        solid: true,
        low: true,
    };
    drawPriority: 'background' = 'background';
    isObject = <const>true;
    isNeutralTarget = true;
    x = this.definition.x;
    y = this.definition.y;
    status: ObjectStatus = this.definition.status;
    animationTime = 0;
    appliedFireToTiles = false;
    flame = new TorchFlame(this);
    constructor(state: GameState, public definition: SimpleObjectDefinition) {
        this.behaviors = {...this.behaviors};
        if (getObjectStatus(state, this.definition)) {
            this.status = 'active';
        }
        if (this.status === 'active') {
            this.behaviors.element = 'fire';
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    getParts(state: GameState) {
        if (this.status === 'active') {
            return [this.flame];
        }
        return [];
    }
    getStyle() {
        return torchStyles[this.definition.style as keyof typeof torchStyles] || torchStyles.torch;
    }
    /*getYDepth(): number {
       return this.y + 8;
    }*/
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'active' && hit.element === 'ice') {
            this.status = 'normal';
            this.behaviors.element = null;
            this.appliedFireToTiles = false;
        } else if (this.status === 'normal' && hit.element === 'fire') {
            this.status = 'active';
            this.behaviors.element = 'fire';
        }
        return { hit: true, pierced: true, setElement: this.behaviors.element };
    }
    onActivate(state: GameState) {
        this.status = 'active';
        this.behaviors.element = 'fire';
    }
    applyFireToTiles(state: GameState) {
        hitTargets(state, this.area, {
            element: 'fire',
            hitCircle: {
                x: this.x + 8,
                y: this.y + 8,
                r: 36,
            },
            hitTiles: true,
        });
        this.appliedFireToTiles = true;
    }
    update(state: GameState) {
        if (this.area && this.status === 'active' && !this.appliedFireToTiles) {
            saveObjectStatus(state, this.definition);
            this.applyFireToTiles(state);
        }
        this.animationTime += FRAME_LENGTH;
    }
    renderFloor() {

    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' && this.status !== 'active') {
            return;
        }
        const style = this.getStyle();
        drawFrameAt(context, getFrame(style.baseAnimation, this.animationTime), {
            x: this.x,
            y: this.y,
            w: 16,
            h: 16,
        });
    }
}
objectHash.torch = Torch;
