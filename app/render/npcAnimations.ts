import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';

/*


createAnimation(
    source: string | HTMLImageElement | HTMLCanvasElement, dimensions: FrameDimensions,
    { x, y, rows, cols, xSpace, top, left, duration, frameMap }?: CreateAnimationOptions,
    props?: ExtraAnimationProperties): FrameAnimation
import createAnimation
*/

const humanGeometry: FrameDimensions = {w: 24, h: 36, content: {x: 4, y: 20, w: 16, h: 16}};

const momImage: string = 'gfx/npcs/24x36-mom.png'; 
const momUpAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 3});
const momDownAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 0});
const momLeftAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 2});
const momRightAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 1});
const momIdleUpAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const momIdleDownAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const momIdleLeftAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const momIdleRightAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const momWalkUpAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const momWalkDownAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const momWalkLeftAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const momWalkRightAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const guyImage: string = 'gfx/npcs/24x36-guy.png'; 
const guyUpAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { x: 0, y: 3});
const guyDownAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { x: 0, y: 0});
const guyLeftAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { x: 0, y: 2});
const guyRightAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { x: 0, y: 1});
const guyIdleUpAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const guyIdleDownAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const guyIdleLeftAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const guyIdleRightAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const guyWalkUpAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const guyWalkDownAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const guyWalkLeftAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const guyWalkRightAnimation: FrameAnimation = createAnimation(guyImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const guy2Image: string = 'gfx/npcs/24x36-guy2.png'; 
const guy2UpAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { x: 0, y: 3});
const guy2DownAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { x: 0, y: 0});
const guy2LeftAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { x: 0, y: 2});
const guy2RightAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { x: 0, y: 1});
const guy2IdleUpAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 3, duration: 4});
const guy2IdleDownAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 0, duration: 4});
const guy2IdleLeftAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 2, duration: 4});
const guy2IdleRightAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 1, duration: 4});
const guy2WalkUpAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 7, duration: 4});
const guy2WalkDownAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 4, duration: 4});
const guy2WalkLeftAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 6, duration: 4});
const guy2WalkRightAnimation: FrameAnimation = createAnimation(guy2Image, humanGeometry, { cols: 4, y: 5, duration: 4});

const galImage: string = 'gfx/npcs/24x36-gal.png'; 
const galUpAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { x: 0, y: 3});
const galDownAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { x: 0, y: 0});
const galLeftAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { x: 0, y: 2});
const galRightAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { x: 0, y: 1});
const galIdleUpAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const galIdleDownAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const galIdleLeftAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const galIdleRightAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const galWalkUpAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const galWalkDownAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const galWalkLeftAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const galWalkRightAnimation: FrameAnimation = createAnimation(galImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const gal2Image: string = 'gfx/npcs/24x36-gal2.png'; 
const gal2UpAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { x: 0, y: 3});
const gal2DownAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { x: 0, y: 0});
const gal2LeftAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { x: 0, y: 2});
const gal2RightAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { x: 0, y: 1});
const gal2IdleUpAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 3, duration: 4});
const gal2IdleDownAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 0, duration: 4});
const gal2IdleLeftAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 2, duration: 4});
const gal2IdleRightAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 1, duration: 4});
const gal2WalkUpAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 7, duration: 4});
const gal2WalkDownAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 4, duration: 4});
const gal2WalkLeftAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 6, duration: 4});
const gal2WalkRightAnimation: FrameAnimation = createAnimation(gal2Image, humanGeometry, { cols: 4, y: 5, duration: 4});

const paleMonkImage: string = 'gfx/npcs/24x36-paleMonk.png'; 
const paleMonkUpAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { x: 0, y: 3});
const paleMonkDownAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { x: 0, y: 0});
const paleMonkLeftAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { x: 0, y: 2});
const paleMonkRightAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { x: 0, y: 1});
const paleMonkIdleUpAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const paleMonkIdleDownAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const paleMonkIdleLeftAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const paleMonkIdleRightAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const paleMonkWalkUpAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const paleMonkWalkDownAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const paleMonkWalkLeftAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const paleMonkWalkRightAnimation: FrameAnimation = createAnimation(paleMonkImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const midMonkImage: string = 'gfx/npcs/24x36-midMonk.png'; 
const midMonkUpAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { x: 0, y: 3});
const midMonkDownAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { x: 0, y: 0});
const midMonkLeftAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { x: 0, y: 2});
const midMonkRightAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { x: 0, y: 1});
const midMonkIdleUpAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const midMonkIdleDownAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const midMonkIdleLeftAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const midMonkIdleRightAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const midMonkWalkUpAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const midMonkWalkDownAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const midMonkWalkLeftAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const midMonkWalkRightAnimation: FrameAnimation = createAnimation(midMonkImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const darkMonkImage: string = 'gfx/npcs/24x36-darkMonk.png'; 
const darkMonkUpAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { x: 0, y: 3});
const darkMonkDownAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { x: 0, y: 0});
const darkMonkLeftAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { x: 0, y: 2});
const darkMonkRightAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { x: 0, y: 1});
const darkMonkIdleUpAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const darkMonkIdleDownAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const darkMonkIdleLeftAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const darkMonkIdleRightAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const darkMonkWalkUpAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const darkMonkWalkDownAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const darkMonkWalkLeftAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const darkMonkWalkRightAnimation: FrameAnimation = createAnimation(darkMonkImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const zoroGeometry: FrameDimensions = {w: 21, h: 32, content: {x: 2, y: 16, w: 16, h: 16}};
const zoroUpAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 2});
const zoroDownAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 0});
const zoroLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 3});
const zoroRightAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 1});
const zoroWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 3, duration: 4});
const zoroWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 0, duration: 4});
const zoroWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 2, duration: 4});
const zoroWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 1, duration: 4});

const vanaraBlackGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraBlackUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 2});
const vanaraBlackDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 0});
const vanaraBlackLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 3});
const vanaraBlackRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 1});
const vanaraBlackWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraBlackWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraBlackWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraBlackWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraBlackWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraBlueGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraBlueUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 2});
const vanaraBlueDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 0});
const vanaraBlueLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 3});
const vanaraBlueRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 1});
const vanaraBlueWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraBlueWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraBlueWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraBlueWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraBlueWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraPurpleGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraPurpleUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 2});
const vanaraPurpleDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 0});
const vanaraPurpleLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 3});
const vanaraPurpleRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 1});
const vanaraPurpleWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraPurpleWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraPurpleWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraPurpleWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraPurpleWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraBrownGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraBrownUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 2});
const vanaraBrownDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 0});
const vanaraBrownLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 3});
const vanaraBrownRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 1});
const vanaraBrownWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraBrownWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraBrownWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraBrownWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraBrownWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraGoldGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraGoldUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 2});
const vanaraGoldDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 0});
const vanaraGoldLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 3});
const vanaraGoldRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 1});
const vanaraGoldWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraGoldWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraGoldWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraGoldWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraGoldWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraGrayGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraGrayUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 2});
const vanaraGrayDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 0});
const vanaraGrayLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 3});
const vanaraGrayRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 1});
const vanaraGrayWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraGrayWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraGrayWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraGrayWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraGrayWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraRedGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraRedUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 2});
const vanaraRedDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 0});
const vanaraRedLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 3});
const vanaraRedRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 1});
const vanaraRedWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraRedWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraRedWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraRedWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraRedWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 1, duration: 4});

export const galAnimations: ActorAnimations = {
    still: {
        up: galUpAnimation,
        down: galDownAnimation,
        left: galLeftAnimation,
        right: galRightAnimation,
    },
    idle: {
        up: galIdleUpAnimation,
        down: galIdleDownAnimation,
        left: galIdleLeftAnimation,
        right: galIdleRightAnimation,
    },
    move: {
        up: galWalkUpAnimation,
        down: galWalkDownAnimation,
        left: galWalkLeftAnimation,
        right: galWalkRightAnimation,
    },
};

export const gal2Animations: ActorAnimations = {
    still: {
        up: gal2UpAnimation,
        down: gal2DownAnimation,
        left: gal2LeftAnimation,
        right: gal2RightAnimation,
    },
    idle: {
        up: gal2IdleUpAnimation,
        down: gal2IdleDownAnimation,
        left: gal2IdleLeftAnimation,
        right: gal2IdleRightAnimation,
    },
    move: {
        up: gal2WalkUpAnimation,
        down: gal2WalkDownAnimation,
        left: gal2WalkLeftAnimation,
        right: gal2WalkRightAnimation,
    },
};

export const darkMonkAnimations: ActorAnimations = {
    still: {
        up: darkMonkUpAnimation,
        down: darkMonkDownAnimation,
        left: darkMonkLeftAnimation,
        right: darkMonkRightAnimation,
    },
    idle: {
        up: darkMonkIdleUpAnimation,
        down: darkMonkIdleDownAnimation,
        left: darkMonkIdleLeftAnimation,
        right: darkMonkIdleRightAnimation,
    },
    move: {
        up: darkMonkWalkUpAnimation,
        down: darkMonkWalkDownAnimation,
        left: darkMonkWalkLeftAnimation,
        right: darkMonkWalkRightAnimation,
    },
};

export const midMonkAnimations: ActorAnimations = {
    still: {
        up: midMonkUpAnimation,
        down: midMonkDownAnimation,
        left: midMonkLeftAnimation,
        right: midMonkRightAnimation,
    },
    idle: {
        up: midMonkIdleUpAnimation,
        down: midMonkIdleDownAnimation,
        left: midMonkIdleLeftAnimation,
        right: midMonkIdleRightAnimation,
    },
    move: {
        up: midMonkWalkUpAnimation,
        down: midMonkWalkDownAnimation,
        left: midMonkWalkLeftAnimation,
        right: midMonkWalkRightAnimation,
    },
};

export const paleMonkAnimations: ActorAnimations = {
    still: {
        up: paleMonkUpAnimation,
        down: paleMonkDownAnimation,
        left: paleMonkLeftAnimation,
        right: paleMonkRightAnimation,
    },
    idle: {
        up: paleMonkIdleUpAnimation,
        down: paleMonkIdleDownAnimation,
        left: paleMonkIdleLeftAnimation,
        right: paleMonkIdleRightAnimation,
    },
    move: {
        up: paleMonkWalkUpAnimation,
        down: paleMonkWalkDownAnimation,
        left: paleMonkWalkLeftAnimation,
        right: paleMonkWalkRightAnimation,
    },
};

export const guyAnimations: ActorAnimations = {
    still: {
        up: guyUpAnimation,
        down: guyDownAnimation,
        left: guyLeftAnimation,
        right: guyRightAnimation,
    },
    idle: {
        up: guyIdleUpAnimation,
        down: guyIdleDownAnimation,
        left: guyIdleLeftAnimation,
        right: guyIdleRightAnimation,
    },
    move: {
        up: guyWalkUpAnimation,
        down: guyWalkDownAnimation,
        left: guyWalkLeftAnimation,
        right: guyWalkRightAnimation,
    },
};

export const guy2Animations: ActorAnimations = {
    still: {
        up: guy2UpAnimation,
        down: guy2DownAnimation,
        left: guy2LeftAnimation,
        right: guy2RightAnimation,
    },
    idle: {
        up: guy2IdleUpAnimation,
        down: guy2IdleDownAnimation,
        left: guy2IdleLeftAnimation,
        right: guy2IdleRightAnimation,
    },
    move: {
        up: guy2WalkUpAnimation,
        down: guy2WalkDownAnimation,
        left: guy2WalkLeftAnimation,
        right: guy2WalkRightAnimation,
    },
};

export const momAnimations: ActorAnimations = {
    still: {
        up: momUpAnimation,
        down: momDownAnimation,
        left: momLeftAnimation,
        right: momRightAnimation,
    },
    idle: {
        up: momIdleUpAnimation,
        down: momIdleDownAnimation,
        left: momIdleLeftAnimation,
        right: momIdleRightAnimation,
    },
    move: {
        up: momWalkUpAnimation,
        down: momWalkDownAnimation,
        left: momWalkLeftAnimation,
        right: momWalkRightAnimation,
    },
};

export const vanaraPurpleAnimations: ActorAnimations = {
    idle: {
        up: vanaraPurpleUpAnimation,
        down: vanaraPurpleDownAnimation,
        left: vanaraPurpleLeftAnimation,
        right: vanaraPurpleRightAnimation,
    },
    move: {
        up: vanaraPurpleWalkUpAnimation,
        down: vanaraPurpleWalkDownAnimation,
        left: vanaraPurpleWalkLeftAnimation,
        right: vanaraPurpleWalkRightAnimation,
    },
};

export const vanaraBlackAnimations: ActorAnimations = {
    idle: {
        up: vanaraBlackUpAnimation,
        down: vanaraBlackDownAnimation,
        left: vanaraBlackLeftAnimation,
        right: vanaraBlackRightAnimation,
    },
    move: {
        up: vanaraBlackWalkUpAnimation,
        down: vanaraBlackWalkDownAnimation,
        left: vanaraBlackWalkLeftAnimation,
        right: vanaraBlackWalkRightAnimation,
    },
};

export const vanaraBlueAnimations: ActorAnimations = {
    idle: {
        up: vanaraBlueUpAnimation,
        down: vanaraBlueDownAnimation,
        left: vanaraBlueLeftAnimation,
        right: vanaraBlueRightAnimation,
    },
    move: {
        up: vanaraBlueWalkUpAnimation,
        down: vanaraBlueWalkDownAnimation,
        left: vanaraBlueWalkLeftAnimation,
        right: vanaraBlueWalkRightAnimation,
    },
};

export const vanaraBrownAnimations: ActorAnimations = {
    idle: {
        up: vanaraBrownUpAnimation,
        down: vanaraBrownDownAnimation,
        left: vanaraBrownLeftAnimation,
        right: vanaraBrownRightAnimation,
    },
    move: {
        up: vanaraBrownWalkUpAnimation,
        down: vanaraBrownWalkDownAnimation,
        left: vanaraBrownWalkLeftAnimation,
        right: vanaraBrownWalkRightAnimation,
    },
};

export const vanaraGoldAnimations: ActorAnimations = {
    idle: {
        up: vanaraGoldUpAnimation,
        down: vanaraGoldDownAnimation,
        left: vanaraGoldLeftAnimation,
        right: vanaraGoldRightAnimation,
    },
    move: {
        up: vanaraGoldWalkUpAnimation,
        down: vanaraGoldWalkDownAnimation,
        left: vanaraGoldWalkLeftAnimation,
        right: vanaraGoldWalkRightAnimation,
    },
};

export const vanaraGrayAnimations: ActorAnimations = {
    idle: {
        up: vanaraGrayUpAnimation,
        down: vanaraGrayDownAnimation,
        left: vanaraGrayLeftAnimation,
        right: vanaraGrayRightAnimation,
    },
    move: {
        up: vanaraGrayWalkUpAnimation,
        down: vanaraGrayWalkDownAnimation,
        left: vanaraGrayWalkLeftAnimation,
        right: vanaraGrayWalkRightAnimation,
    },
};

export const vanaraRedAnimations: ActorAnimations = {
    idle: {
        up: vanaraRedUpAnimation,
        down: vanaraRedDownAnimation,
        left: vanaraRedLeftAnimation,
        right: vanaraRedRightAnimation,
    },
    move: {
        up: vanaraRedWalkUpAnimation,
        down: vanaraRedWalkDownAnimation,
        left: vanaraRedWalkLeftAnimation,
        right: vanaraRedWalkRightAnimation,
    },
};

export const zoroAnimations: ActorAnimations = {
    idle: {
        up: zoroUpAnimation,
        down: zoroDownAnimation,
        left: zoroLeftAnimation,
        right: zoroRightAnimation,
    },
    move: {
        up: zoroWalkUpAnimation,
        down: zoroWalkDownAnimation,
        left: zoroWalkLeftAnimation,
        right: zoroWalkRightAnimation,
    },
};