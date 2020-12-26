import { Tile } from 'app/types';

export interface Actor {
    x: number,
    y: number,
    w: number,
    h: number,
    d: 'left' | 'right' | 'up' | 'down',
    pickUpFrame?: number,
    pickUpTile?: Tile,
}

export interface Hero extends Actor {

}

