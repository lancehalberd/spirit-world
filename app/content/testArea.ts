import { AreaDefinition } from 'app/types';

const t0 = {x: 3, y: 16}, t1 = {x: 2, y: 16}, t2 = {x: 0, y: 16}, t3 = {x: 16, y: 8}, t4 = {x: 1, y: 16};
export const area: AreaDefinition = {
    layers: [
        {
            key: 'background',
            grid: {
                w: 32,
                h: 32,
                palette: 'worldMap',
                tiles: [
                    [t0,t0,t1,t0,t0,t1,t1,t1,t0,t2,t0,t3,t3,t3,t1,t4,t4,t0,t1,t4,t2,t4,t1,t2,t0,t1,t4,t4,t2,t0,t4,t2],
                    [t2,t1,t4,t0,t2,t0,t4,t0,t2,t0,t0,t3,t3,t3,t2,t2,t1,t0,t0,t2,t0,t4,t1,t0,t2,t4,t2,t4,t4,t4,t4,t4],
                    [t4,t1,t2,t1,t2,t2,t4,t0,t2,t1,t2,t3,t3,t3,t2,t4,t1,t0,t1,t0,t1,t2,t2,t2,t4,t2,t4,t1,t0,t4,t1,t4],
                    [t0,t2,t2,t0,t0,t0,t1,t2,t0,t0,t4,t1,t1,t4,t0,t0,t0,t0,t4,t1,t0,t0,t1,t1,t4,t2,t0,t2,t4,t4,t2,t1],
                    [t2,t0,t2,t0,t2,t0,t2,t3,t3,t4,t0,t4,t0,t2,t2,t0,t0,t4,t2,t1,t4,t4,t1,t4,t1,t0,t2,t4,t0,t0,t1,t4],
                    [t0,t1,t2,t4,t2,t0,t3,t0,t1,t3,t2,t4,t4,t4,t3,t0,t0,t4,t0,t1,t2,t1,t0,t2,t1,t1,t1,t0,t2,t0,t4,t0],
                    [t1,t2,t0,t2,t0,t2,t3,t2,t2,t3,t0,t4,t4,t2,t3,t1,t2,t1,t2,t4,t4,t1,t0,t4,t2,t2,t0,t2,t2,t0,t0,t0],
                    [t1,t4,t2,t0,t4,t0,t0,t3,t3,t2,t1,t4,t4,t0,t3,t0,t0,t0,t2,t1,t1,t4,t4,t4,t2,t2,t0,t0,t4,t4,t0,t4],
                    [t0,t0,t4,t0,t1,t1,t1,t4,t1,t4,t1,t2,t0,t2,t3,t0,t0,t4,t2,t4,t2,t2,t0,t0,t1,t1,t4,t1,t4,t1,t0,t1],
                    [t2,t4,t3,t2,t0,t0,t0,t0,t2,t0,t2,t1,t1,t4,t3,t1,t4,t1,t2,t0,t1,t2,t0,t1,t2,t4,t2,t4,t1,t4,t4,t2],
                    [t2,t2,t2,t4,t2,t1,t4,t0,t1,t4,t1,t0,t0,t4,t2,t0,t0,t2,t0,t2,t2,t1,t1,t4,t2,t4,t2,t1,t4,t1,t0,t2],
                    [t2,t1,t1,t0,t0,t1,t4,t2,t0,t0,t0,t2,t0,t1,t1,t2,t2,t2,t1,t2,t2,t1,t1,t0,t4,t1,t4,t2,t4,t0,t2,t0],
                    [t0,t0,t2,t1,t1,t2,t1,t0,t4,t0,t4,t1,t4,t0,t4,t2,t1,t1,t2,t1,t0,t1,t4,t1,t1,t4,t4,t0,t1,t2,t4,t2],
                    [t0,t4,t0,t1,t2,t1,t4,t2,t2,t4,t1,t0,t0,t4,t0,t1,t4,t0,t1,t0,t0,t4,t4,t2,t4,t4,t0,t4,t4,t2,t0,t1],
                    [t0,t2,t4,t4,t2,t4,t1,t2,t2,t0,t1,t2,t2,t4,t4,t1,t0,t2,t0,t1,t1,t2,t4,t1,t0,t0,t1,t2,t2,t1,t4,t4],
                    [t4,t0,t2,t2,t0,t2,t2,t4,t2,t2,t1,t2,t1,t2,t1,t4,t2,t2,t2,t4,t1,t0,t2,t4,t2,t2,t2,t4,t4,t4,t0,t4],
                    [t4,t4,t2,t2,t1,t0,t4,t4,t0,t0,t2,t1,t0,t2,t1,t1,t1,t4,t1,t0,t1,t0,t4,t0,t4,t0,t2,t0,t4,t2,t4,t2],
                    [t4,t0,t1,t4,t2,t2,t4,t1,t2,t2,t0,t4,t2,t4,t0,t4,t1,t4,t4,t1,t1,t0,t1,t0,t1,t1,t1,t0,t4,t0,t0,t0],
                    [t1,t1,t1,t4,t1,t0,t1,t0,t0,t4,t1,t0,t1,t0,t0,t0,t2,t4,t2,t0,t0,t0,t4,t2,t2,t0,t0,t0,t4,t4,t1,t4],
                    [t0,t0,t0,t1,t0,t0,t0,t4,t1,t1,t2,t0,t1,t4,t0,t0,t0,t1,t2,t4,t1,t1,t2,t4,t0,t0,t2,t1,t1,t4,t1,t0],
                    [t2,t1,t2,t4,t1,t1,t2,t2,t4,t4,t4,t1,t2,t4,t2,t1,t1,t4,t4,t4,t0,t0,t2,t4,t2,t2,t4,t0,t4,t2,t1,t2],
                    [t2,t0,t0,t0,t1,t0,t1,t0,t0,t0,t1,t2,t0,t4,t4,t4,t0,t1,t0,t0,t4,t4,t4,t1,t1,t1,t1,t0,t1,t1,t2,t4],
                    [t4,t0,t1,t0,t0,t4,t1,t4,t2,t0,t4,t0,t2,t4,t0,t0,t2,t0,t1,t0,t4,t2,t0,t4,t1,t1,t1,t0,t4,t4,t1,t4],
                    [t2,t2,t0,t2,t4,t2,t2,t0,t0,t1,t4,t0,t2,t0,t1,t0,t4,t0,t0,t1,t4,t4,t4,t1,t2,t0,t1,t1,t1,t0,t2,t2],
                    [t2,t1,t4,t2,t1,t2,t4,t0,t2,t0,t0,t2,t4,t1,t0,t0,t4,t2,t4,t2,t2,t0,t2,t1,t0,t0,t2,t4,t0,t0,t0,t0],
                    [t0,t4,t1,t0,t4,t4,t0,t4,t1,t2,t1,t1,t2,t0,t0,t0,t1,t2,t1,t4,t0,t1,t1,t2,t0,t4,t4,t0,t1,t0,t0,t2],
                    [t2,t0,t4,t1,t1,t2,t4,t2,t4,t4,t1,t0,t2,t2,t1,t1,t0,t0,t4,t1,t0,t0,t1,t1,t2,t4,t2,t2,t2,t4,t0,t1],
                    [t4,t1,t2,t2,t4,t4,t2,t2,t4,t1,t2,t2,t2,t0,t1,t4,t1,t0,t1,t4,t4,t1,t0,t0,t4,t2,t0,t2,t1,t2,t1,t4],
                    [t4,t0,t1,t1,t0,t2,t4,t4,t0,t1,t1,t2,t4,t4,t0,t4,t4,t0,t0,t0,t0,t2,t1,t0,t1,t0,t2,t2,t4,t1,t0,t4],
                    [t4,t1,t0,t4,t2,t0,t4,t4,t4,t4,t1,t1,t2,t2,t0,t1,t0,t0,t2,t1,t0,t1,t2,t4,t4,t2,t0,t2,t4,t1,t1,t2],
                    [t0,t2,t4,t2,t2,t4,t4,t1,t1,t0,t4,t4,t0,t0,t1,t4,t4,t1,t4,t0,t2,t4,t4,t0,t4,t2,t2,t4,t2,t1,t0,t1],
                    [t4,t4,t4,t0,t1,t1,t1,t1,t2,t2,t0,t0,t0,t4,t2,t2,t2,t0,t4,t2,t0,t0,t2,t2,t2,t0,t2,t4,t2,t0,t0,t2],
                ],
            },
        },
    ],
};
