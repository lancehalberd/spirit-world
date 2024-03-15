import { createAnimation } from 'app/utils/animations';


export const iceFrontAnimation = createAnimation('gfx/effects/iceOverlay.png', {w: 34, h: 34}, {left: 15, top: 5});
export const iceRightAnimation = createAnimation('gfx/effects/iceOverlay.png', {w: 16, h: 32}, {left: 0, top: 32});
export const iceLeftAnimation = createAnimation('gfx/effects/iceOverlay.png', {w: 16, h: 32}, {left: 48, top: 32});
export const iceTopAnimation = createAnimation('gfx/effects/iceOverlay.png', {w: 32, h: 16}, {left: 16, top: 64});
