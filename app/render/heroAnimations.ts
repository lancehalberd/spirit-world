import { createAnimation } from 'app/utils/animations';
import { debugCanvas } from 'app/dom';

import { ActorAnimations, AnimationSet, FrameAnimation, FrameDimensions } from 'app/types';

export const Y_OFF = -4;

const heroGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 15 + Y_OFF, w: 16, h: 16}};
const upAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 2});
const downAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 0});
const leftAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 3});
const rightAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 1});
const heroShallowGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const upShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 2});
const downShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 0});
const leftShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 3});
const rightShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 1});

const hurtGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const hurtUpAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 2});
const hurtDownAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 0});
const hurtLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 3});
const hurtRightAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 1});

const walkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const walkUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 1, duration: 4});
const walkShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 1, duration: 4});


const walkChargeDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkChargeDownRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 1, duration: 4});
const walkChargeRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkChargeUpRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkChargeUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 4, duration: 4});
const walkChargeUpLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 5, duration: 4});
const walkChargeLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 6, duration: 4});
const walkChargeDownLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 8, y: 7, duration: 4});

const idleChargeDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 0, duration: 4});
const idleChargeDownRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 1, duration: 4});
const idleChargeRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 2, duration: 4});
const idleChargeUpRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 3, duration: 4});
const idleChargeUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 4, duration: 4});
const idleChargeUpLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 5, duration: 4});
const idleChargeLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 6, duration: 4});
const idleChargeDownLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramwalkcharge.png', walkingGeometry, { cols: 1, x: 7, y: 7, duration: 4});

const walkChargeBowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkChargeBowDownRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 1, duration: 4});
const walkChargeBowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkChargeBowUpRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkChargeBowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 4, duration: 4});
const walkChargeBowUpLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 5, duration: 4});
const walkChargeBowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 6, duration: 4});
const walkChargeBowDownLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 8, y: 7, duration: 4});

const idleChargeBowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 0, duration: 4});
const idleChargeBowDownRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 1, duration: 4});
const idleChargeBowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 2, duration: 4});
const idleChargeBowUpRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 3, duration: 4});
const idleChargeBowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 4, duration: 4});
const idleChargeBowUpLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 5, duration: 4});
const idleChargeBowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 6, duration: 4});
const idleChargeBowDownLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcbowwalk.png', walkingGeometry, { cols: 1, x: 7, y: 7, duration: 4});


const attackingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const attackUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 2, duration: 3}, {loop: false});
const attackDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 0, duration: 3}, {loop: false});
const attackLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 3, duration: 3}, {loop: false});
const attackRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 1, duration: 3}, {loop: false});
const attackShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 2, duration: 3}, {loop: false});
const attackShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 0, duration: 3}, {loop: false});
const attackShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 3, duration: 3}, {loop: false});
const attackShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 1, duration: 3}, {loop: false});
const mcCloakUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 2, duration: 6, frameMap: [1, 3]}, {loop: false});
const mcCloakDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 0, duration: 6, frameMap: [1, 3]}, {loop: false});
const mcCloakLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 3, duration: 6, frameMap: [1, 3]}, {loop: false});
const mcCloakRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 1, duration: 6, frameMap: [1, 3]}, {loop: false});


const rollGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const rollUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 2, duration: 4}, {loop: false});
const rollDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 0, duration: 4}, {loop: false});
const rollLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 3, duration: 4}, {loop: false});
const rollRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 1, duration: 4}, {loop: false});


const pushGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const grabUpAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 1, y: 2, duration: 8});
const grabDownAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 1, y: 0, duration: 8});
const grabLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 1, y: 3, duration: 8});
const grabRightAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 1, y: 1, duration: 8});
const pullUpAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 2, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pullDownAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 2, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pullLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 2, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pullRightAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 2, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});
const pushUpAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 5, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pushDownAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 5, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pushLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 5, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pushRightAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 5, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});
const grabShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 2, duration: 8});
const grabShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 0, duration: 8});
const grabShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 3, duration: 8});
const grabShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 1, duration: 8});
const pullShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pullShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pullShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pullShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});

// Animations for picking up and carraying objects
let frameMap = [1, 2, 0];
const pickupUpAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 0, y: 2, duration: 3, frameMap});
const pickupDownAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 0, y: 0, duration: 3, frameMap});
const pickupLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 0, y: 3, duration: 3, frameMap});
const pickupRightAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 3, x: 0, y: 1, duration: 3, frameMap});
const idleCarryUpAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 0, y: 2, duration: 8});
const idleCarryDownAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 0, y: 0, duration: 8});
const idleCarryLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 0, y: 3, duration: 8});
const idleCarryRightAnimation: FrameAnimation = createAnimation('gfx/mc/mccarrypushpull.png', pushGeometry, { cols: 1, x: 0, y: 1, duration: 8});
const walkCarryUpAnimation: FrameAnimation = createAnimation('gfx/mc/mc4directionliftwalk.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkCarryDownAnimation: FrameAnimation = createAnimation('gfx/mc/mc4directionliftwalk.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkCarryLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mc4directionliftwalk.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkCarryRightAnimation: FrameAnimation = createAnimation('gfx/mc/mc4directionliftwalk.png', walkingGeometry, { cols: 8, y: 1, duration: 4});

const climbGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const climbUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcclimb.png', climbGeometry, { cols: 9, duration: 6});

const swimGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const floatUpAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 2, duration: 16});
const floatDownAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 0, duration: 16});
const floatLeftAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 3, duration: 16});
const floatRightAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 1, duration: 16});
const swimUpAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 2, duration: 8});
const swimDownAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 0, duration: 8});
const swimLeftAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 3, duration: 8});
const swimRightAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 1, duration: 8});


const spiritGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const spiritUpAnimation: FrameAnimation = createAnimation('gfx/mc/spiritmovesheet.png', spiritGeometry, { cols: 8, y: 2, duration: 10});
const spiritDownAnimation: FrameAnimation = createAnimation('gfx/mc/spiritmovesheet.png', spiritGeometry, { cols: 8, y: 0, duration: 10});
const spiritLeftAnimation: FrameAnimation = createAnimation('gfx/mc/spiritmovesheet.png', spiritGeometry, { cols: 8, y: 3, duration: 10});
const spiritRightAnimation: FrameAnimation = createAnimation('gfx/mc/spiritmovesheet.png', spiritGeometry, { cols: 8, y: 1, duration: 10});
const spiritPushUpAnimation: FrameAnimation = createAnimation('gfx/mc/spiritholdpushsheet.png', spiritGeometry, { cols: 8, y: 2, duration: 10});
const spiritPushDownAnimation: FrameAnimation = createAnimation('gfx/mc/spiritholdpushsheet.png', spiritGeometry, { cols: 8, y: 0, duration: 10});
const spiritPushLeftAnimation: FrameAnimation = createAnimation('gfx/mc/spiritholdpushsheet.png', spiritGeometry, { cols: 8, y: 3, duration: 10});
const spiritPushRightAnimation: FrameAnimation = createAnimation('gfx/mc/spiritholdpushsheet.png', spiritGeometry, { cols: 8, y: 1, duration: 10});
const spiritPullUpAnimation: FrameAnimation = createAnimation('gfx/mc/spiritpullsheet.png', spiritGeometry, { cols: 8, y: 2, duration: 10});
const spiritPullDownAnimation: FrameAnimation = createAnimation('gfx/mc/spiritpullsheet.png', spiritGeometry, { cols: 8, y: 0, duration: 10});
const spiritPullLeftAnimation: FrameAnimation = createAnimation('gfx/mc/spiritpullsheet.png', spiritGeometry, { cols: 8, y: 3, duration: 10});
const spiritPullRightAnimation: FrameAnimation = createAnimation('gfx/mc/spiritpullsheet.png', spiritGeometry, { cols: 8, y: 1, duration: 10});

const fallGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
export const fallAnimation: FrameAnimation = createAnimation('gfx/mc/mcfall.png', fallGeometry, { cols: 13, duration: 4}, { loop: false });

const chargeGeometry: FrameDimensions = {w: 24, h: 32, content: {x: 4, y: 16, w: 16, h: 16} };
export const chargeBackAnimation: FrameAnimation = createAnimation('gfx/mc/aura.png', chargeGeometry, { cols: 4, y: 0, duration: 5});
export const chargeFrontAnimation: FrameAnimation = createAnimation('gfx/mc/aura.png', chargeGeometry, { cols: 4, y: 1, duration: 5});
export const chargeFireBackAnimation: FrameAnimation = createAnimation('gfx/mc/aura_fire.png', chargeGeometry, { cols: 4, y: 0, duration: 5});
export const chargeFireFrontAnimation: FrameAnimation = createAnimation('gfx/mc/aura_fire.png', chargeGeometry, { cols: 4, y: 1, duration: 5});
export const chargeIceBackAnimation: FrameAnimation = createAnimation('gfx/mc/aura_ice.png', chargeGeometry, { cols: 4, y: 0, duration: 5});
export const chargeIceFrontAnimation: FrameAnimation = createAnimation('gfx/mc/aura_ice.png', chargeGeometry, { cols: 4, y: 1, duration: 5});
export const chargeLightningBackAnimation: FrameAnimation = createAnimation('gfx/mc/aura_lightning.png', chargeGeometry, { cols: 4, y: 0, duration: 5});
export const chargeLightningFrontAnimation: FrameAnimation = createAnimation('gfx/mc/aura_lightning.png', chargeGeometry, { cols: 4, y: 1, duration: 5});

const bowGeometry: FrameDimensions = {w: 30, h: 28};
const bowDownAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 1, duration: 4});
const bowDownRightAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 5, duration: 4});
const bowRightAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 9, duration: 4});
const bowUpRightAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 13, duration: 4});
const bowUpAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 1, x: 16, duration: 4});
const bowUpLeftAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 18, duration: 4});
const bowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 22, duration: 4});
const bowDownLeftAnimation: FrameAnimation = createAnimation('gfx/mc/bow1.png', bowGeometry, { cols: 3, x: 26, duration: 4});

const cloakGeometry: FrameDimensions = {w: 32, h: 32};
const cloakFrameMap = [0, 0, 1, 2, 3, 4, 5, 6, 7];
const cloakDownAnimation: FrameAnimation = createAnimation('gfx/effects/cloak_throw.png', cloakGeometry, { cols: 8, x: 0, duration: 2, frameMap: cloakFrameMap});
const cloakRightAnimation: FrameAnimation = createAnimation('gfx/effects/cloak_throw.png', cloakGeometry, { cols: 8, x: 8, duration: 2, frameMap: cloakFrameMap});
const cloakUpAnimation: FrameAnimation = createAnimation('gfx/effects/cloak_throw.png', cloakGeometry, { cols: 8, x: 16, duration: 2, frameMap: cloakFrameMap});
const cloakLeftAnimation: FrameAnimation = createAnimation('gfx/effects/cloak_throw.png', cloakGeometry, { cols: 8, x: 24, duration: 2, frameMap: cloakFrameMap});


const dlArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {cols: 1});
const drArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 2, cols: 1});
const urArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 4, cols: 1});
const ulArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 6, cols: 1});
const downArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 8, cols: 1});
const rightArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 10, cols: 1});
const upArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 12, cols: 1});
const leftArrowAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16}, {x: 14, cols: 1});


const mcStaffGeometry = {w: 21, h: 28, content: {x: 3, y: 12, w: 16, h: 16} };
const mcStaffJumpDownAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 3, x: 1, duration: 3,  frameMap: [0, 1, 1, 1, 1, 2, 2, 2, 2]});
const mcStaffJumpRightAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 3, x: 6, duration: 3, frameMap: [0, 1, 1, 1, 1, 2, 2, 2, 2]});
const mcStaffJumpUpAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 2, x: 11, duration: 3,   frameMap: [0, 0, 0, 0, 0, 1, 1, 1, 1]});
const mcStaffJumpLeftAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 3, x: 15, duration: 3, frameMap: [0, 1, 1, 1, 1, 2, 2, 2, 2]});
const mcStaffSlamDownAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 1, x: 4, duration: 9});
const mcStaffSlamRightAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 1, x: 9, duration: 9});
const mcStaffSlamUpAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 1, x: 13, duration: 9});
const mcStaffSlamLeftAnimation: FrameAnimation = createAnimation('gfx/mc/wukong_staff_mc.png', mcStaffGeometry, { cols: 1, x: 18, duration: 9});

const staffGeometry = {w: 123, h: 181};
const staffDownAnimation: FrameAnimation = createAnimation('gfx/effects/wukong_staff.png', staffGeometry, { cols: 8, x: 0, duration: 3, frameMap: [0, 1, 2, 3, 4, 5, 6, 6, 6, 7]}, {loop: false});
const staffRightAnimation: FrameAnimation = createAnimation('gfx/effects/wukong_staff.png', staffGeometry, { cols: 10, x: 8, duration: 3}, {loop: false});
const staffUpAnimation: FrameAnimation = createAnimation('gfx/effects/wukong_staff.png', staffGeometry, { cols: 8, x: 18, duration: 3, frameMap: [0, 1, 2, 3, 4, 5, 6, 6, 6, 7]}, {loop: false});
const staffLeftAnimation: FrameAnimation = createAnimation('gfx/effects/wukong_staff.png', staffGeometry, { cols: 10, x: 26, duration: 3}, {loop: false});

debugCanvas;//(staffDownAnimation.frames[0]);

export const bowAnimations: AnimationSet = {
    up: bowUpAnimation,
    upleft: bowUpLeftAnimation,
    upright: bowUpRightAnimation,
    down: bowDownAnimation,
    downleft: bowDownLeftAnimation,
    downright: bowDownRightAnimation,
    left: bowLeftAnimation,
    right: bowRightAnimation,
}

export const arrowAnimations: AnimationSet = {
    up: upArrowAnimation,
    upleft: ulArrowAnimation,
    upright: urArrowAnimation,
    down: downArrowAnimation,
    downleft: dlArrowAnimation,
    downright: drArrowAnimation,
    left: leftArrowAnimation,
    right: rightArrowAnimation,
}

export const cloakAnimations: AnimationSet = {
    up: cloakUpAnimation,
    down: cloakDownAnimation,
    left: cloakLeftAnimation,
    right: cloakRightAnimation,
}

export const staffAnimations: AnimationSet = {
    up: staffUpAnimation,
    down: staffDownAnimation,
    left: staffLeftAnimation,
    right: staffRightAnimation,
}

export const heroAnimations: ActorAnimations = {
    attack: {
        up: attackUpAnimation,
        down: attackDownAnimation,
        left: attackLeftAnimation,
        right: attackRightAnimation,
    },
    cloak: {
        up: mcCloakUpAnimation,
        down: mcCloakDownAnimation,
        left: mcCloakLeftAnimation,
        right: mcCloakRightAnimation,
    },
    staffJump: {
        up: mcStaffJumpUpAnimation,
        down: mcStaffJumpDownAnimation,
        left: mcStaffJumpLeftAnimation,
        right: mcStaffJumpRightAnimation,
    },
    staffSlam: {
        up: mcStaffSlamUpAnimation,
        down: mcStaffSlamDownAnimation,
        left: mcStaffSlamLeftAnimation,
        right: mcStaffSlamRightAnimation,
    },
    climbing: {
        up: climbUpAnimation,
    },
    falling: {
        up: fallAnimation,
        down: fallAnimation,
        left: fallAnimation,
        right: fallAnimation,
    },
    grab: {
        up: grabUpAnimation,
        down: grabDownAnimation,
        left: grabLeftAnimation,
        right: grabRightAnimation,
    },
    hurt: {
        up: hurtUpAnimation,
        down: hurtDownAnimation,
        left: hurtLeftAnimation,
        right: hurtRightAnimation,
    },
    idle: {
        up: upAnimation,
        down: downAnimation,
        left: leftAnimation,
        right: rightAnimation,
    },
    move: {
        up: walkUpAnimation,
        down: walkDownAnimation,
        left: walkLeftAnimation,
        right: walkRightAnimation,
    },
    pull: {
        up: pullUpAnimation,
        down: pullDownAnimation,
        left: pullLeftAnimation,
        right: pullRightAnimation,
    },
    push: {
        up: pushUpAnimation,
        down: pushDownAnimation,
        left: pushLeftAnimation,
        right: pushRightAnimation,
    },
    roll: {
        up: rollUpAnimation,
        down: rollDownAnimation,
        left: rollLeftAnimation,
        right: rollRightAnimation,
    },
};

export const heroShallowAnimations: ActorAnimations = {
    attack: {
        up: attackShallowUpAnimation,
        down: attackShallowDownAnimation,
        left: attackShallowLeftAnimation,
        right: attackShallowRightAnimation,
    },
    grab: {
        up: grabShallowUpAnimation,
        down: grabShallowDownAnimation,
        left: grabShallowLeftAnimation,
        right: grabShallowRightAnimation,
    },
    idle: {
        up: upShallowAnimation,
        down: downShallowAnimation,
        left: leftShallowAnimation,
        right: rightShallowAnimation,
    },
    move: {
        up: walkShallowUpAnimation,
        down: walkShallowDownAnimation,
        left: walkShallowLeftAnimation,
        right: walkShallowRightAnimation,
    },
    pull: {
        up: pullShallowUpAnimation,
        down: pullShallowDownAnimation,
        left: pullShallowLeftAnimation,
        right: pullShallowRightAnimation,
    },
    push: {
        up: pushShallowUpAnimation,
        down: pushShallowDownAnimation,
        left: pushShallowLeftAnimation,
        right: pushShallowRightAnimation,
    },
};

export const heroCarryAnimations: ActorAnimations = {
    grab: {
        up: pickupUpAnimation,
        down: pickupDownAnimation,
        left: pickupLeftAnimation,
        right: pickupRightAnimation,
    },
    idle: {
        up: idleCarryUpAnimation,
        down: idleCarryDownAnimation,
        left: idleCarryLeftAnimation,
        right: idleCarryRightAnimation,
    },
    move: {
        up: walkCarryUpAnimation,
        down: walkCarryDownAnimation,
        left: walkCarryLeftAnimation,
        right: walkCarryRightAnimation,
    },
};

export const heroChargeChakramAnimations: ActorAnimations = {
    idle: {
        up: idleChargeUpAnimation,
        upleft: idleChargeUpLeftAnimation,
        upright: idleChargeUpRightAnimation,
        down: idleChargeDownAnimation,
        downleft: idleChargeDownLeftAnimation,
        downright: idleChargeDownRightAnimation,
        left: idleChargeLeftAnimation,
        right: idleChargeRightAnimation,
    },
    move: {
        up: walkChargeUpAnimation,
        upleft: walkChargeUpLeftAnimation,
        upright: walkChargeUpRightAnimation,
        down: walkChargeDownAnimation,
        downleft: walkChargeDownLeftAnimation,
        downright: walkChargeDownRightAnimation,
        left: walkChargeLeftAnimation,
        right: walkChargeRightAnimation,
    },
};

export const heroChargeBowAnimations: ActorAnimations = {
    idle: {
        up: idleChargeBowUpAnimation,
        upleft: idleChargeBowUpLeftAnimation,
        upright: idleChargeBowUpRightAnimation,
        down: idleChargeBowDownAnimation,
        downleft: idleChargeBowDownLeftAnimation,
        downright: idleChargeBowDownRightAnimation,
        left: idleChargeBowLeftAnimation,
        right: idleChargeBowRightAnimation,
    },
    move: {
        up: walkChargeBowUpAnimation,
        upleft: walkChargeBowUpLeftAnimation,
        upright: walkChargeBowUpRightAnimation,
        down: walkChargeBowDownAnimation,
        downleft: walkChargeBowDownLeftAnimation,
        downright: walkChargeBowDownRightAnimation,
        left: walkChargeBowLeftAnimation,
        right: walkChargeBowRightAnimation,
    },
};

export const heroSwimAnimations: ActorAnimations = {
    idle: {
        up: floatUpAnimation,
        down: floatDownAnimation,
        left: floatLeftAnimation,
        right: floatRightAnimation,
    },
    move: {
        up: swimUpAnimation,
        down: swimDownAnimation,
        left: swimLeftAnimation,
        right: swimRightAnimation,
    },
};


export const heroSpiritAnimations: ActorAnimations = {
    grab: {
        up: spiritPullUpAnimation,
        down: spiritPullDownAnimation,
        left: spiritPullLeftAnimation,
        right: spiritPullRightAnimation,
    },
    idle: {
        up: spiritUpAnimation,
        down: spiritDownAnimation,
        left: spiritLeftAnimation,
        right: spiritRightAnimation,
    },
    move: {
        up: spiritUpAnimation,
        down: spiritDownAnimation,
        left: spiritLeftAnimation,
        right: spiritRightAnimation,
    },
    pull: {
        up: spiritPullUpAnimation,
        down: spiritPullDownAnimation,
        left: spiritPullLeftAnimation,
        right: spiritPullRightAnimation,
    },
    push: {
        up: spiritPushUpAnimation,
        down: spiritPushDownAnimation,
        left: spiritPushLeftAnimation,
        right: spiritPushRightAnimation,
    },
};
