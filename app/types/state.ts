import { AreaGrid, AreaInstance, Hero, ShortRectangle, Zone, ZoneLocation } from 'app/types';

export type SavedState = {
    coins: number,
    collectedItems: {[key: string]: boolean},
    hero: Hero,
}

export type Scene = 'title'
    | 'chooseGameMode' | 'deleteSavedGame' | 'deleteSavedGameConfirmation'
    | 'game' | 'credits' | 'options';

export interface GameState {
    savedState: SavedState,
    savedGames: SavedState[],
    savedGameIndex: number,
    hero: Hero,
    camera: { x: number, y: number },
    time: number,
    gameHasBeenInitialized: boolean,
    lastTimeRendered: number,
    alternateAreaInstance?: AreaInstance,
    areaInstance?: AreaInstance,
    areaSection?: ShortRectangle,
    nextAreaInstance?: AreaInstance,
    nextAreaSection?: ShortRectangle,
    zone: Zone,
    areaGrid: AreaGrid,
    location: ZoneLocation,
    paused: boolean,
    menuIndex: number,
    defeated: boolean,
    scene: Scene,
}
