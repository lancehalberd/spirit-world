import { createCanvasAndContext } from 'app/dom';
import { drawFrame } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';

import {Frame, GameState } from 'app/types';


interface Props {
    frame?: Frame,
    x?: number
    y?: number,
}

export class LootObject {
    type = 'lootObject' as 'lootObject';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    constructor({frame, x = 0, y = 0 }: Props) {
        this.frame = frame;
        this.x = x;
        this.y = y;
    }
    onObtainLoot(state: GameState) {
        // Implement for each loot type.
    }
    update(state: GameState) {
        if (rectanglesOverlap(state.hero, {...this.frame, x: this.x, y: this.y})) {
            this.onObtainLoot(state);
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
        }
    }
    render(context, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y });
    }
}

const [peachCanvas, peachContext] = createCanvasAndContext(10, 10);
peachContext.fillStyle = 'orange';
peachContext.fillRect(0, 0, 10, 10);
const peachFrame = {image: peachCanvas, x: 0, y: 0, w: peachCanvas.width, h: peachCanvas.height};
const peachQuarterFrame = {image: peachCanvas, x: 0, y: 0, w: peachCanvas.width / 2, h: peachCanvas.height / 2};

export class PeachOfImmortality extends LootObject {
    constructor({x = 0, y = 0 }: Props) {
        super({frame: peachFrame, x, y});
    }
    onObtainLoot(state: GameState) {
        state.hero.maxLife++;
        state.hero.life++;
    }
}

export class PeachOfImmortalityQuarter extends LootObject {
    constructor({x = 0, y = 0 }: Props) {
        super({frame: peachQuarterFrame, x, y});
    }
    onObtainLoot(state: GameState) {
        state.hero.peachQuarters++;
        if (state.hero.peachQuarters >= 4) {
            state.hero.peachQuarters -= 4;
            state.hero.maxLife++;
            state.hero.life = state.hero.maxLife;
        }
    }
}