import { Tile } from 'app/types';

export interface Actor {
    x: number,
    y: number,
    w: number,
    h: number,
    d: 'left' | 'right' | 'up' | 'down',
    action?: 'roll'
    actionFrame?: number,
    life: number,
    maxLife: number,
    peachQuarters: number,
    pickUpFrame?: number,
    pickUpTile?: Tile,
    invulnerableFrames?: number,
}

export interface Hero extends Actor {

}

