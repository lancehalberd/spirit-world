import { AreaGrid, AreaInstance, Hero, ShortRectangle, Zone } from 'app/types';

export type SavedState = {
    coins: number,
    collectedItems: {[key: string]: boolean},
    hero: Hero,
}

export type Scene = 'title' | 'chooseGameMode' | 'game' | 'credits' | 'options';

export interface GameState {
    savedState: SavedState,
    savedGames: SavedState[],
    savedGameIndex: number,
    hero: Hero,
    camera: { x: number, y: number },
    time: number,
    gameHasBeenInitialized: boolean,
    lastTimeRendered: number,
    areaInstance?: AreaInstance,
    areaSection?: ShortRectangle,
    nextAreaInstance?: AreaInstance,
    nextAreaSection?: ShortRectangle,
    zone: Zone,
    areaGrid: AreaGrid,
    areaGridCoords: {x: number, y: number},
    floor: number,
    paused: boolean,
    menuIndex: number,
    defeated: boolean,
    scene: Scene,
}
