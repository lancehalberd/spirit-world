import { zones } from 'app/content/zones/zoneHash';

import { AreaDefinition } from 'app/types';

const t0 = {x: 10, y: 0}, t1 = {x: 9, y: 0}, t2 = {x: 0, y: 0}, t3 = {x: 13, y: 0}, t4 = {x: 12, y: 0}, t5 = {x: 3, y: 1}, t6 = {x: 1, y: 1}, t7 = {x: 2, y: 1}, t8 = {x: 5, y: 0}, t9 = {x: 6, y: 0}, t10 = {x: 11, y: 0}, t11 = {x: 4, y: 1}, t12 = {x: 0, y: 1}, t13 = {x: 15, y: 0}, t14 = {x: 14, y: 0};
const f0_0x0: AreaDefinition = {
    layers: [
        {
            key: 'floor',
            grid: {
                w: 32,
                h: 32,
                palette: 'floor',
                tiles: [
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                    [t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0,t0],
                ],
            },
        },
        {
            key: 'field',
            grid: {
                w: 32,
                h: 32,
                palette: 'field',
                tiles: [
                    [t1,t1,t2,t2,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1],
                    [t1,t1,t2,t2,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1],
                    [t1,t1,t2,t2,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t3,t4,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t1,t2,t5,t2,t2,t2,t2,t2,t2,t2,t2,t2,t6,t7,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t8,t9,t1,t3,t2,t10,t3,t2,t2,t6,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t11,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t4,t2,t2,t2,t2,t2,t2,t2,t2,t3,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t10,t2,t2,t3,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t4,t2,t7,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t6,t11,t2,t2,t2,t7,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t12,t1,t1],
                    [t1,t1,t2,t2,t6,t2,t2,t2,t2,t2,t2,t2,t12,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t10,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t13,t2,t2,t11,t2,t3,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t11,t2,t2,t2,t2,t2,t2,t2,t2,t5,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t10,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t5,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t3,t2,t2,t2,t2,t5,t2,t3,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t7,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t6,t7,t2,t2,t2,t2,t5,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t4,t2,t6,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t7,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t5,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t11,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t12,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t13,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t14,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t12,t2,t2,t1,t1],
                    [t1,t1,t2,t5,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t11,t2,t2,t2,t2,t2,t13,t2,t2,t2,t7,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t3,t3,t2,t2,t2,t2,t2,t2,t2,t2,t3,t2,t2,t2,t2,t2,t2,t2,t14,t2,t1,t1],
                    [t1,t1,t10,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t10,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t14,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t14,t2,t2,t2,t3,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t3,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t7,t2,t2,t2,t2,t2,t2,t11,t2,t2,t2,t2,t12,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t6,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t3,t2,t1,t1],
                    [t1,t1,t2,t14,t2,t2,t2,t2,t2,t2,t2,t14,t5,t2,t2,t2,t2,t6,t11,t2,t2,t12,t14,t2,t2,t2,t2,t10,t2,t13,t1,t1],
                    [t1,t1,t11,t2,t2,t2,t2,t2,t2,t2,t4,t2,t2,t2,t2,t2,t2,t2,t2,t10,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t10,t2,t2,t2,t10,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t2,t2,t5,t2,t14,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t2,t11,t2,t2,t2,t2,t2,t2,t2,t1,t1],
                    [t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1],
                    [t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1,t1],
                ],
            },
        },
    ],
    objects: [
        {type: "door", id: "demo_entrance:0:0x0-glovesDoor", status: "normal", targetZone: "demo_gloves", targetObjectId: "gloves:0:0x0-entrance", d: "up", x: 32, y: 0},
        {type: "chest", id: "demo_entrance:0:0x0-gloves-0", lootType: "gloves", status: "normal", level: 0, amount: 1, x: 64, y: 80},
        {type: "marker", id: "demo_entrance:0:0x0-glovesMarker", status: "normal", x: 96, y: 48},
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32},
    ],
};
const sf0_0x0: AreaDefinition = null;
zones.demo_entrance = {
    key: 'demo_entrance',
    floors: [
        {
            grid: [
                [f0_0x0,],
            ],
            spiritGrid: [
                [sf0_0x0,],
            ],
        },
    ],
};