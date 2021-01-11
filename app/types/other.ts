import { TileGrid, TilePalette } from 'app/types';

export interface ExtraAnimationProperties {
    // The animation will loop unless this is explicitly set to false.
    loop?: boolean,
    // Frame to start from after looping.
    loopFrame?: number,
}
export type FrameAnimation = {
    frames: Frame[],
    frameDuration: number,
    duration: number,
} & ExtraAnimationProperties

export type Color = string;
export type CardinalDirection = 'N' | 'S' | 'W' | 'E';

export type Point = [number, number];
export type Range = [number, number];

export type Tags = {[key: string]: true};

export interface Renderable {
    render(context: CanvasRenderingContext2D, target: ShortRectangle): void
}

export type GameContext = 'cutscene' | 'enchant' | 'field' | 'item' | 'jewel' | 'jewelCrafting' | 'map';

export interface FullRectangle {
    left: number,
    top: number,
    width: number,
    height: number,
    right?: number,
    bottom?: number,
}
export interface ShortRectangle {
    x: number,
    y: number,
    w: number,
    h: number,
}
export interface FrameDimensions {
    w: number,
    h: number,
    // This is a bit of a hack but it is a simple way of allowing me to
    // associate a depth value for an image.
    d?: number,
    // If a frame is much larger than the content it represents, this rectangle
    // represents the position and dimension of the content relative to the whole frame.
    // The w/h here should be taken as the literal w/h of the rectangle in the image containing
    // the main content, not as actual in game geometry.
    // Contrast thiis with AreaObjectTarget where the `h` value is the height of the object in the game,
    // which is typically less than the height of the image (imageContentHeight = gameHeight + gameDepth / 2).
    content?: ShortRectangle,
}
export interface FrameRectangle extends ShortRectangle {
    // When a frame does not perfectly fit the size of the content, this content rectangle can be
    // set to specify the portion of the image that is functionally part of the object in the frame.
    // For example, a character with a long time may have the content around the character's body and
    // exclude the tail when looking at the width/height of the character.
    content?: ShortRectangle,
}

export interface Frame extends FrameRectangle {
    image: HTMLCanvasElement | HTMLImageElement,
    // Additional property that may be used in some cases to indicate a frame should be flipped
    // horizontally about the center of its content. Only some contexts respect this.
    flipped?: boolean,
}

export interface TintedFrame extends Frame {
    color: string,
    // Can be used for partial tints.
    amount?: number,
    image: HTMLCanvasElement | HTMLImageElement,
}

export type ArrayFrame = [string, number, number, number, number, number, number];

export interface TextPopup {
    value?: string | number,
    fontSize?: number,
    x: number, y: number, z: number,
    vx: number, vy: number,
    color: Color,
    duration?: number,
    gravity?: number,
}

export type PointsType = 'anima' | 'coins' | 'divinity' | 'fame';
// Cost is an amount of coins or a map of points types to amounts.
export type Cost = number | {[key in PointsType]?: number};

export interface HUDElement extends ShortRectangle {
    isPointOver: (x: number, y: number) => boolean,
    helpMethod?: () => string,
    onClick?: () => void,
}

export interface MenuOption {
    // getLabel will be used instead of label if defined.
    getLabel?: () => string,
    label?: string,
    onSelect?: () => void,
    getChildren?: () => MenuOption[],
}

export interface EditorArrayProperty<T> {
    name: string,
    id?: string,
    // A button property will have no value.
    value?: T[],
    // If the property is an enum, you can set the list of all values.
    values?: T[],
    // If the property is editable, you can specify what happens when it is changed.
    onChange: (newValue: T[]) => void,
}

// This is used to allow a user to select a tile/group of tiles from a tile palette.
export interface EditorPaletteProperty {
    name: string,
    id?: string,
    // The selection is a complete tile grid, but will often be used to represent a single tile.
    value?: TileGrid,
    palette: TilePalette,
    onChange: (newValue: TileGrid) => void,
}

export interface EditorButtonProperty {
    name: string,
    id?: string,
    onClick: () => void,
}

export interface EditorSingleProperty<T> {
    name: string,
    id?: string,
    // A button property will have no value.
    value?: T,
    // If the property is an enum, you can set the list of all values.
    values?: T[],
    // If the property is editable, you can specify what happens when it is changed.
    onChange?: (newValue: T) => (T | void),
}
export type EditorProperty<T> = EditorArrayProperty<T> | EditorSingleProperty<T> | EditorButtonProperty | EditorPaletteProperty;
export type PropertyRow = (EditorProperty<any> | string)[];

export type PanelRows = (EditorProperty<any> | PropertyRow | string)[];

export type Coords = [number, number];
