import { AreaGrid, AreaInstance, Hero, ShortRectangle, Zone } from 'app/types';

export type SavedState = {
    coins: number,
    collectedItems: {[key: string]: boolean},
}

export interface GameState {
    savedState: SavedState,
    hero: Hero,
    camera: { x: number, y: number },
    time: number,
    gameHasBeenInitialized: boolean,
    lastTimeRendered: number,
    areaInstance?: AreaInstance,
    areaSection?: ShortRectangle,
    nextAreaInstance?: AreaInstance,
    zone: Zone,
    areaGrid: AreaGrid,
    areaGridCoords: {x: number, y: number},
    paused: boolean,
    menuIndex: number,
    defeated: boolean,
    defeatedIndex: number,
}
