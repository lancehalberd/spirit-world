import { zones } from 'app/content/zones/zoneHash';

const f0_0x0: AreaDefinition = {
    layers: [
        {
            key: 'floor',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                ],
            },
        },
        {
            key: 'field',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                ],
            },
        },
    ],
    objects: [
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32, index: 825, mapId: 'dream', floorId: '1F', mapX: 0, mapY: 0},
    ],
};
const f0_0x1: AreaDefinition = {
    layers: [
        {
            key: 'floor',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                    [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
                ],
            },
        },
        {
            key: 'field',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,400,0,0,0,0,0,0,0,0,398,399,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,408,411,0,0,0,0,0,0,0,0,410,409,399,399,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,408,403,403,411,0,0,0,0,0,0,0,0,0,0,410,403,403,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,408,411,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,410,409,399,399,399,399,399,399],
                    [399,399,399,399,399,408,411,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,410,409,399,399,399,399,399],
                    [399,399,399,399,399,400,0,0,0,406,395,396,189,189,189,189,189,189,189,189,394,395,407,0,0,0,398,399,399,399,399,399],
                    [399,399,399,399,399,400,0,0,406,413,399,400,189,189,189,189,189,189,189,189,398,399,412,407,0,0,398,399,399,399,399,399],
                    [399,399,399,399,408,411,0,0,398,399,408,411,0,0,0,0,0,0,0,0,410,409,399,400,0,0,410,409,399,399,399,399],
                    [399,399,408,403,411,0,0,0,398,408,411,0,0,0,0,0,0,0,0,0,0,410,409,400,0,0,0,410,403,409,399,399],
                    [399,408,411,0,0,0,0,406,413,400,0,0,0,406,395,395,395,395,407,0,0,0,398,412,407,0,0,0,0,410,409,399],
                    [399,412,407,0,0,0,406,413,399,400,0,0,406,413,399,399,399,399,412,407,0,0,398,399,412,407,0,0,0,406,413,399],
                    [399,399,412,395,395,395,413,399,408,411,0,0,398,399,399,399,399,399,399,400,0,0,410,409,399,412,395,395,395,413,399,399],
                    [399,399,399,399,399,399,399,408,411,0,0,0,398,399,399,399,399,399,399,400,0,0,0,410,409,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,400,0,0,0,406,413,399,399,399,399,399,399,412,407,0,0,0,398,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,400,0,0,406,413,399,399,399,399,399,399,399,399,412,407,0,0,398,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,400,0,0,398,399,399,399,399,399,399,399,399,399,399,400,0,0,398,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,412,407,406,413,399,399,399,399,399,399,399,399,399,399,412,407,406,413,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,412,413,399,399,399,399,399,399,399,399,399,399,399,399,412,413,399,399,399,399,399,399,399,399],
                    [399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399,399],
                ],
            },
        },
    ],
    objects: [
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32},
    ],
};
const sf0_0x0: AreaDefinition = {
    isSpiritWorld: true,
    parentDefinition: f0_0x0,
    layers: null,
    objects: [
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32, mapId: 'undefinedSpirit'},
    ],
};
const sf0_0x1: AreaDefinition = {
    isSpiritWorld: true,
    parentDefinition: f0_0x1,
    layers: null,
    objects: [
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32, mapId: 'undefinedSpirit'},
    ],
};
zones.dream = {
    key: 'dream',
    areaSize: {w: 32, h: 32},
    floors: [
        {
            grid: [
                [f0_0x0,],
                [f0_0x1,],
            ],
            spiritGrid: [
                [sf0_0x0,],
                [sf0_0x1,],
            ],
        },
    ],
};