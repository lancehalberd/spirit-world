import { enterArea, getAreaFromGridCoords } from 'app/content/areas';
import { Snake } from 'app/content/enemy';
import { worldMap as testWorld } from 'app/content/peachCaveB1';

import { GameState, Hero, SavedState } from 'app/types';

function getDefaultSavedState(): SavedState {
    return {
        coins: 0,
        collectedItems: {},
    };
}

function getDefaultHeroState(): Hero {
    return {
        x: 150, y: 445, z: 0,
        vx: 0, vy: 0, vz: 0,
        w: 16, h: 16,
        d: 'down',
        life: 4, maxLife: 4,
        magic: 0,
        // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
        maxMagic: 20,
        // base 4, max 8-10
        magicRegen: 0,
        // inventory
        money: 0,
        chakrams: 0,
        arrows: 0,
        peachQuarters: 0,
        spiritTokens: 0,
        activeTools: {
            weapon: 0,
            bow: 0,
            staff: 0,
            clone: 0,
            invisibility: 0,
        },
        equipment: {
            cloudBoots: 0,
            ironBoots: 0,
        },
        passiveTools: {
            gloves: 1,
            roll: 0,
            cloudSomersalt: 0,
            charge: 0,
            nimbusCloud: 0,
            catEyes: 0,
            spiritSight: 0,
            trueSight: 0,
            astralProjection: 0,
            telekinesis: 0,
            ironSkin: 0,
            goldMail: 0,
            phoenixCrown: 0,
            waterBlessing: 0,
            fireBlessing: 0,
        },
        elements: {
            fire: 0,
            ice: 0,
            lightning: 0,
        },
    };
}

function getDefaultState(): GameState {
    return {
        savedState: getDefaultSavedState(),
        hero: getDefaultHeroState(),
        camera: { x: 0, y: 0 },
        time: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
        areaGrid: testWorld,
        areaGridCoords: {x: 1, y: 1},
    };
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    enterArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), state.hero.x, state.hero.y);

    /*state.areaInstance.objects.push(new ProgressiveWeapon({x: 60, y: 20}));
    state.areaInstance.objects.push(new ProgressiveGlove({x: 451, y: 227}));
    state.areaInstance.objects.push(new ProgressiveGlove({x: 126, y: 92}));
    state.areaInstance.objects.push(new PeachOfImmortality({x: 226, y: 384}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 150, y: 150}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 300, y: 150}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 150, y: 300}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 300, y: 300}));
    state.areaInstance.objects.push(new DodgeRoll({x: 225, y: 225}));*/
    state.areaInstance.enemies.push(new Snake({d: 'up', x: 125, y: 130}));
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

