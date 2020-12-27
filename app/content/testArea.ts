import { AreaDefinition } from 'app/types';

const t0 = {x: 3, y: 16}, t1 = {x: 2, y: 16}, t2 = {x: 7, y: 8}, t3 = {x: 0, y: 16}, t4 = {x: 16, y: 8}, t5 = {x: 1, y: 16}, t6 = {x: 5, y: 8}, t7 = {x: 1, y: 8}, t8 = {x: 1, y: 13};
export const area: AreaDefinition = {
    layers: [
        {
            key: 'background',
            grid: {
                w: 32,
                h: 32,
                palette: 'worldMap',
                tiles: [
                    [t0,t0,t1,t0,t0,t1,t1,t2,t0,t3,t0,t4,t4,t4,t1,t5,t5,t0,t1,t5,t3,t5,t1,t3,t0,t1,t5,t5,t3,t0,t5,t3],
                    [t3,t1,t5,t0,t3,t0,t5,t2,t2,t0,t0,t4,t4,t4,t3,t3,t1,t0,t0,t3,t0,t5,t1,t0,t3,t5,t3,t5,t5,t5,t5,t5],
                    [t5,t1,t3,t1,t3,t3,t5,t2,t2,t1,t3,t4,t4,t4,t3,t5,t1,t0,t1,t0,t1,t3,t3,t3,t5,t3,t5,t1,t0,t5,t1,t5],
                    [t6,t3,t3,t0,t0,t0,t1,t2,t0,t0,t5,t1,t1,t5,t0,t0,t0,t0,t5,t1,t0,t0,t1,t1,t5,t3,t0,t6,t6,t6,t6,t6],
                    [t6,t0,t3,t0,t3,t0,t3,t4,t4,t5,t0,t5,t0,t3,t3,t0,t0,t5,t3,t1,t5,t5,t1,t5,t1,t0,t3,t6,t1,t1,t1,t6],
                    [t6,t1,t3,t5,t3,t0,t4,t0,t1,t4,t3,t5,t5,t5,t4,t0,t0,t5,t0,t1,t3,t1,t0,t3,t1,t1,t1,t6,t1,t6,t1,t6],
                    [t6,t3,t0,t3,t0,t3,t7,t3,t3,t4,t0,t5,t5,t3,t4,t1,t3,t1,t3,t5,t5,t1,t0,t5,t3,t3,t0,t6,t2,t6,t2,t6],
                    [t6,t2,t2,t5,t2,t6,t0,t4,t4,t3,t1,t5,t5,t0,t4,t0,t0,t0,t3,t1,t1,t5,t5,t5,t3,t3,t0,t6,t8,t6,t8,t6],
                    [t6,t0,t6,t2,t6,t6,t1,t5,t1,t5,t1,t3,t0,t3,t4,t0,t0,t5,t3,t5,t3,t3,t0,t0,t1,t1,t5,t6,t8,t6,t0,t6],
                    [t6,t5,t1,t1,t1,t6,t0,t0,t3,t0,t3,t1,t1,t5,t4,t1,t5,t1,t3,t0,t1,t3,t0,t1,t3,t5,t3,t6,t2,t6,t2,t6],
                    [t6,t2,t6,t2,t1,t6,t5,t0,t1,t5,t1,t0,t0,t5,t3,t0,t0,t3,t0,t3,t3,t1,t1,t5,t3,t5,t3,t6,t8,t6,t0,t6],
                    [t6,t1,t1,t0,t2,t6,t5,t3,t0,t0,t0,t3,t0,t1,t1,t3,t3,t3,t1,t3,t3,t1,t1,t0,t5,t1,t5,t6,t8,t6,t3,t6],
                    [t6,t2,t2,t1,t1,t6,t1,t0,t5,t0,t5,t1,t5,t0,t5,t3,t1,t1,t3,t1,t0,t1,t5,t1,t1,t5,t5,t6,t2,t6,t2,t6],
                    [t6,t5,t2,t1,t3,t6,t5,t3,t3,t5,t1,t0,t0,t5,t0,t1,t5,t0,t1,t0,t0,t5,t5,t3,t5,t5,t0,t6,t8,t6,t0,t6],
                    [t0,t3,t2,t1,t6,t6,t1,t3,t3,t0,t1,t3,t3,t5,t5,t1,t0,t3,t0,t1,t1,t3,t5,t1,t0,t0,t1,t6,t3,t6,t5,t5],
                    [t6,t6,t6,t6,t6,t6,t3,t5,t3,t3,t1,t3,t1,t3,t1,t5,t3,t3,t3,t5,t1,t0,t3,t5,t3,t3,t8,t6,t6,t6,t6,t6],
                    [t5,t5,t3,t3,t1,t0,t5,t5,t0,t0,t3,t1,t0,t3,t1,t1,t1,t5,t1,t0,t1,t0,t5,t0,t5,t0,t3,t0,t5,t3,t5,t3],
                    [t5,t0,t1,t5,t3,t3,t5,t1,t3,t3,t0,t5,t3,t5,t0,t5,t1,t5,t5,t1,t1,t0,t1,t0,t1,t1,t1,t0,t5,t0,t0,t0],
                    [t1,t1,t1,t5,t1,t0,t1,t0,t0,t5,t1,t0,t1,t0,t0,t0,t3,t5,t3,t0,t0,t0,t5,t3,t3,t0,t0,t0,t5,t5,t1,t5],
                    [t0,t0,t0,t1,t0,t0,t0,t5,t1,t1,t3,t0,t1,t5,t0,t0,t0,t1,t3,t5,t1,t1,t3,t5,t0,t0,t3,t1,t1,t5,t1,t0],
                    [t3,t1,t3,t5,t1,t1,t3,t3,t5,t5,t5,t1,t3,t5,t3,t1,t1,t5,t5,t5,t0,t0,t3,t5,t3,t3,t5,t0,t5,t3,t1,t3],
                    [t3,t0,t0,t0,t1,t0,t1,t0,t0,t0,t1,t3,t0,t5,t5,t5,t0,t1,t0,t0,t5,t5,t5,t1,t1,t1,t1,t0,t1,t1,t3,t5],
                    [t5,t0,t1,t0,t0,t5,t1,t5,t3,t0,t5,t0,t3,t5,t0,t0,t3,t0,t1,t0,t5,t3,t0,t5,t1,t1,t1,t0,t5,t5,t1,t5],
                    [t3,t3,t0,t3,t5,t3,t3,t0,t0,t1,t5,t0,t3,t0,t1,t0,t5,t0,t0,t1,t5,t5,t5,t1,t3,t0,t1,t1,t1,t0,t3,t3],
                    [t3,t1,t5,t3,t1,t3,t5,t0,t3,t0,t0,t3,t5,t1,t0,t0,t5,t3,t5,t3,t3,t0,t3,t1,t0,t0,t3,t5,t0,t0,t0,t0],
                    [t0,t5,t1,t0,t5,t5,t0,t5,t1,t3,t1,t1,t3,t0,t0,t0,t1,t3,t1,t5,t0,t1,t1,t3,t0,t5,t5,t0,t1,t0,t0,t3],
                    [t3,t0,t5,t1,t1,t3,t5,t3,t5,t5,t1,t0,t3,t3,t1,t1,t0,t0,t5,t1,t0,t0,t1,t1,t3,t5,t3,t3,t3,t5,t0,t1],
                    [t5,t1,t3,t3,t5,t5,t3,t3,t5,t1,t3,t3,t3,t0,t1,t5,t1,t0,t1,t5,t5,t1,t0,t0,t5,t3,t0,t3,t1,t3,t1,t5],
                    [t5,t0,t1,t1,t0,t3,t5,t5,t0,t1,t1,t3,t5,t5,t0,t5,t5,t0,t0,t0,t0,t3,t1,t0,t1,t0,t3,t3,t5,t1,t0,t5],
                    [t5,t1,t0,t5,t3,t0,t5,t5,t5,t5,t1,t1,t3,t3,t0,t1,t0,t0,t3,t1,t0,t1,t3,t5,t5,t3,t0,t3,t5,t1,t1,t3],
                    [t0,t3,t5,t3,t3,t5,t5,t1,t1,t0,t5,t5,t0,t0,t1,t5,t5,t1,t5,t0,t3,t5,t5,t0,t5,t3,t3,t5,t3,t1,t0,t1],
                    [t5,t5,t5,t0,t1,t1,t1,t1,t3,t3,t0,t0,t0,t5,t3,t3,t3,t0,t5,t3,t0,t0,t3,t3,t3,t0,t3,t5,t3,t0,t0,t3],
                ],
            },
        },
    ],
};