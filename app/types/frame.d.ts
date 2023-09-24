interface ExtraAnimationProperties {
    // The animation will loop unless this is explicitly set to false.
    loop?: boolean
    // Frame to start from after looping.
    loopFrame?: number
}
type FrameAnimation = {
    frames: Frame[]
    frameDuration: number
    duration: number
} & ExtraAnimationProperties

interface FrameDimensions {
    w: number
    h: number
    // This is a bit of a hack but it is a simple way of allowing me to
    // associate a depth value for an image.
    d?: number
    // If a frame is much larger than the content it represents, this rectangle
    // represents the position and dimension of the content relative to the whole frame.
    // The w/h here should be taken as the literal w/h of the rectangle in the image containing
    // the main content, not as actual in game geometry.
    // Contrast thiis with AreaObjectTarget where the `h` value is the height of the object in the game,
    // which is typically less than the height of the image (imageContentHeight = gameHeight + gameDepth / 2).
    content?: Rect
    // Optional scale that can be set on the frame. Most contexts ignore this, but those that support it
    // will multiple the w/h values by this number as well as the content values if present.
    s?: number
}
interface FrameRectangle extends Rect {
    // When a frame does not perfectly fit the size of the content, this content rectangle can be
    // set to specify the portion of the image that is functionally part of the object in the frame.
    // For example, a character with a long tail may have the content around the character's body and
    // exclude the tail when looking at the width/height of the character.
    content?: Rect
    // Optional scale that can be set on the frame. Most contexts ignore this, but those that support it
    // will multiple the w/h values by this number as well as the content values if present.
    s?: number
}

interface Frame extends FrameRectangle {
    image: HTMLCanvasElement | HTMLImageElement
    // Additional property that may be used in some cases to indicate a frame should be flipped
    // horizontally about the center of its content. Only some contexts respect this.
    flipped?: boolean
}

interface FrameWithPattern extends Frame {
    pattern?: CanvasPattern
}

interface TintedFrame extends Frame {
    color: string
    // Can be used for partial tints.
    amount?: number
    image: HTMLCanvasElement | HTMLImageElement
}

interface CreateAnimationOptions {
    x?: number, y?: number
    xSpace?: number
    ySpace?: number
    rows?: number, cols?: number
    top?: number, left?: number
    duration?: number
    frameMap?: number[]
}
