import { AreaInstance, Hero } from 'app/types';

export type SavedState = {
    coins: number,
}

export interface GameState {
    savedState: SavedState,
    hero: Hero,
    camera: { x: number, y: number },
    time: number,
    gameHasBeenInitialized: boolean,
    areaInstance?: AreaInstance,
}
