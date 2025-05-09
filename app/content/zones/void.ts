import { zones } from 'app/content/zones/zoneHash';

const f0_0x0: AreaDefinition = {
    layers: [
        {
            key: 'space',
            drawPriority: 'background',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57],
                    [57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57],
                    [57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57],
                    [57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57],
                    [57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57],
                    [57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57],
                    [57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57],
                    [57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57],
                    [57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57],
                    [57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,57,57,57,57],
                    [57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57],
                ],
            },
        },
        {
            key: 'floor',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1007,1007,1007,1005,1005,1005,1005,1005,1005,1007,1007,1007,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1007,1007,1007,1007,1005,1004,1004,1004,1004,1005,1007,1007,1007,1007,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,1007,1007,1007,1007,1007,1007,1005,1004,1004,1004,1004,1005,1007,1007,1007,1007,1007,1007,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0,0],
                    [0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0],
                    [0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0],
                    [0,0,0,1007,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1007,0,0,0],
                    [0,0,0,1007,1005,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1005,1007,0,0,0],
                    [0,0,1007,1007,1005,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1005,1007,1007,0,0],
                    [0,0,1007,1007,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1007,1007,0,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [0,1007,1007,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1007,1007,0],
                    [0,1007,1007,1005,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1005,1007,1007,0],
                    [0,1007,1007,1005,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1005,1007,1007,0],
                    [0,1007,1007,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1007,1007,0],
                    [0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,0,1007,1007,1007,1007,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1007,1007,1007,1007,0,0],
                    [0,0,0,1007,1007,1007,1005,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1005,1007,1007,1007,0,0,0],
                    [0,0,0,1007,1007,1007,1005,1004,1004,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1004,1004,1005,1007,1007,1007,0,0,0],
                    [0,0,0,0,1007,1007,1005,1005,1005,1005,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1005,1005,1005,1005,1007,1007,0,0,0,0],
                    [0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0],
                    [0,0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1092,1093,1093,1094,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'floor2',
            drawPriority: 'background',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1017,1063,1063,1064,1063,1064,1063,1064,1063,1064,1063,1064,1064,1016,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,1017,1052,0,0,0,0,0,0,0,0,0,0,0,0,1050,1016,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,1017,0,0,1051,0,0,0,0,0,0,0,0,0,0,0,0,1049,0,0,1016,0,0,0,0,0,0],
                    [0,0,0,0,0,1017,0,0,0,1052,0,0,0,0,0,0,0,0,0,0,0,0,1050,0,0,0,1016,0,0,0,0,0],
                    [0,0,0,0,1017,0,0,0,0,1051,0,0,0,0,0,0,0,0,0,0,0,0,1049,0,0,0,0,1016,0,0,0,0],
                    [0,0,0,1017,0,0,0,0,0,1052,0,0,0,0,0,0,0,0,0,0,0,0,1050,0,0,0,0,0,1016,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1051,0,0,0,0,0,0,0,0,0,0,0,0,1049,0,0,0,0,0,0,0,0,0],
                    [0,0,1017,0,0,0,0,0,0,1052,0,0,0,0,0,0,0,0,0,0,0,0,1050,0,0,0,0,0,0,1016,0,0],
                    [0,0,0,0,0,0,0,0,0,1052,0,0,0,0,0,0,0,0,0,0,0,0,1050,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1068,0,0,1054,1053,1054,1053,1054,1053,1054,1053,0,0,1067,0,0,0,0,0,0,0,0,0],
                    [0,1017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1016,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1051,0,0,1101,1101,1103,1101,1103,1103,0,0,1049,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1051,0,0,0,0,0,0,0,0,0,0,1049,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1052,0,0,0,0,0,0,0,0,0,0,1050,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1068,1053,1054,1053,0,0,0,0,1054,1053,1054,1067,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1101,1101,1103,0,0,0,0,1101,1103,1103,0,0,0,0,0,0,0,0,0,0,0],
                    [0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0,0,0],
                    [0,0,0,0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0,0,0,0],
                    [0,0,0,0,0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0,0,0,0,0],
                    [0,0,0,0,0,0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,1013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1012,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1013,0,0,0,0,0,0,0,0,1012,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'lava',
            drawPriority: 'background',
            hasCustomLogic: true, customLogic: 'voidFlame',
            invertLogic: true,
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,898,887,887,887,887,887,887,899,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,898,905,891,891,891,891,891,891,904,899,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,890,891,891,891,891,891,891,891,891,892,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,890,891,891,891,891,891,891,891,891,892,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,890,891,891,891,891,891,891,891,891,892,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,902,901,891,891,891,891,891,891,900,903,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,902,901,900,895,895,901,900,903,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,890,892,0,0,890,892,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,890,892,0,0,890,892,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,890,892,0,0,890,892,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,890,892,0,0,890,892,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,898,900,903,0,0,902,901,899,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,890,892,0,0,0,0,890,892,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,902,903,0,0,0,0,902,903,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'field',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1086,0,0,0,0,0,0,0,0,0,0,0,0,1085,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1089,1091,0,0,0,0,0,0,0,0,1089,1091,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,996,1092,1094,981,980,981,980,981,980,981,980,1092,1094,999,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,996,1098,1100,990,989,990,989,990,989,990,989,1098,1100,999,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,996,1101,1103,1103,0,0,0,0,0,0,1101,1101,1103,999,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,1003,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1089,1090,1090,1091,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,996,980,981,980,1092,1093,1093,1094,981,980,981,999,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1000,989,990,989,1098,1099,1099,1100,990,989,990,1003,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1101,1102,1102,1103,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,189,189,189,189,189,189,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,189,189,189,189,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
    ],
    objects: [
        {status: "normal", id: "voidTree", x: 208, y: 24, type: "boss", enemyType: "voidTree", lootType: "empty", lootAmount: 1, lootLevel: 1, d: "down", params: {}},
        {status: "normal", id: "voidEntrance", x: 224, y: 496, type: "door", style: "wideEntrance", targetZone: "tree", targetObjectId: "voidEntrance", d: "down"},
        {status: "normal", id: "", x: 272, y: 173, type: "lavafall", w: 32, h: 40, hasCustomLogic: true, customLogic: "voidFlame", invertLogic: true},
        {status: "normal", id: "", x: 208, y: 173, type: "lavafall", w: 32, h: 40, hasCustomLogic: true, customLogic: "voidFlame", invertLogic: true},
        {status: "normal", id: "voidStormEntrance", x: 352, y: 424, type: "teleporter", hasCustomLogic: true, customLogic: "voidStorm", invertLogic: true},
        {status: "normal", id: "voidFrostEntrance", x: 144, y: 424, type: "teleporter", hasCustomLogic: true, invertLogic: true, customLogic: "voidFrost"},
        {status: "normal", id: "voidStoneEntrance", x: 56, y: 184, type: "teleporter", hasCustomLogic: true, customLogic: "voidStone", invertLogic: true},
        {status: "normal", id: "voidFlameEntrance", x: 440, y: 184, type: "teleporter", invertLogic: true, hasCustomLogic: true, customLogic: "voidFlame"},
        {status: "normal", id: "finalMom", x: 248, y: 56, d: "down", behavior: "idle", style: "mom", type: "npc", dialogueKey: "mom", hasCustomLogic: true, customLogic: "voidTree"},
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32, index: 470, mapId: 'void', floorId: '1F', mapX: 1, mapY: 2},
    ],
};
const sf0_0x0: AreaDefinition = {
    isSpiritWorld: true,
    parentDefinition: f0_0x0,
    layers: [
        {
            key: 'space',
            drawPriority: 'background',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,28,57,57,57,57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0],
                    [57,57,57,57,0,0,0,0,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0],
                    [57,57,57,57,57,1,1,0,0,57,57,57,57,57,57,57,57,57,57,57,57,57,57,1,1,1,1,57,57,57,57,0],
                    [57,57,57,1,1,1,0,0,0,0,0,57,57,57,57,57,57,57,57,57,57,1,1,1,0,0,1,1,1,57,57,0],
                    [57,57,1,1,1,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,1,1,1,0,0,0,0,1,1,1,57,0],
                    [57,57,1,1,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,1,1,0,0,0,0,0,0,1,1,57,0],
                    [57,1,1,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,0,0,0,0,0,0,0,0,1,1,0],
                    [57,1,1,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,0,0,0,0,0,0,0,0,1,1,0],
                    [57,1,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,0,0,0,0,0,0,0,0,0,0,1,0],
                    [57,1,1,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,0,0,0,0,0,0,0,0,0,1,0],
                    [57,57,1,1,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,1,1,0,0,0,0,0,0,0,0,57,0],
                    [57,57,1,1,1,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,1,1,1,0,0,0,0,0,0,0,57,0],
                    [57,57,57,1,1,1,0,0,0,0,0,57,57,57,57,57,57,57,57,57,57,1,1,1,0,0,0,0,0,57,57,0],
                    [0,57,57,57,57,1,1,1,0,57,57,57,57,57,57,57,57,57,57,57,57,57,57,1,1,1,0,57,57,57,57,0],
                    [0,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,0],
                    [57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,0],
                    [57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,0],
                    [57,57,57,57,57,57,0,0,0,0,57,57,57,57,57,57,57,57,57,57,57,57,1,1,0,0,57,57,57,57,57,0],
                    [57,57,57,57,0,0,0,0,0,0,0,0,57,57,57,57,57,57,57,57,1,1,1,0,0,0,0,0,57,57,57,0],
                    [57,57,57,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,1,0,0,0,0,0,0,0,57,0,0],
                    [57,57,57,0,0,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,0,0,0,0,0,0,0,0,57,0,0],
                    [57,57,0,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [57,57,1,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,1,1,0,0,0,0,0,0,0,0,0,1,0,0],
                    [57,57,1,0,0,0,0,0,0,0,0,0,0,0,57,57,57,57,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [57,57,1,1,0,0,0,0,0,0,0,0,0,0,57,57,57,57,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
                    [57,57,57,1,1,0,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,0,0,0,0,0,1,1,1,57,0,0],
                    [57,57,57,1,1,1,0,0,0,0,0,0,0,57,57,57,57,57,57,1,1,1,0,0,0,0,1,1,1,57,0,0],
                    [57,57,57,57,1,1,1,0,0,0,0,0,57,57,57,57,57,57,57,57,1,1,1,0,0,1,1,1,57,57,0,0],
                    [57,57,57,57,57,57,1,1,1,0,57,57,57,57,57,57,57,57,57,57,57,57,1,1,1,1,57,57,57,57,0,0],
                    [57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'floor',
            drawPriority: 'background',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
                    [1,1,1,1,1,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1,1,1,1,0],
                    [1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,0],
                    [1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0],
                    [1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0],
                    [1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0],
                    [0,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0],
                    [0,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0],
                    [0,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,0],
                    [0,1,1,1,1,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1,1,1,1,0],
                    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,1,1,1,1,1,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1,1,1,1,1,0],
                    [0,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,0],
                    [0,0,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,0],
                    [0,0,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,0,0],
                    [0,0,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0,0],
                    [0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1007,1007,1,0,0],
                    [0,0,0,0,1007,1007,1007,1007,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1007,1007,1007,1007,1,1,0,0],
                    [0,0,0,0,0,1,1007,1007,1007,1007,1,1,1,1,1,1,1,1,1,1,1,1,1007,1007,1007,1007,1,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'floor2',
            drawPriority: 'background',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
                    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
                    [0,0,0,0,1017,0,1,0,0,1016,1,1,1,0,0,0,0,0,0,0,0,1,1017,0,1,1,0,1016,1,1,1,0],
                    [0,0,1017,0,0,1,1,0,0,1,1,1016,0,0,0,0,0,0,0,0,1017,1,1,1,1,1,1,0,1,1016,0,0],
                    [1,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,1,0,0,0],
                    [1,1017,0,1,1,0,0,0,0,1,1,0,1016,0,0,0,0,0,0,1017,0,1,1,0,0,0,0,1,1,0,1016,0],
                    [1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,1,1,0,0,0],
                    [1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,0,0],
                    [1,0,1,1,0,0,0,0,0,1,1,0,0,1,1,1,1,1,1,0,1,1,1,0,0,0,0,1,1,0,0,0],
                    [1,0,1,1,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,0,0,0],
                    [0,1013,0,1,1,0,0,0,0,1,1,0,1012,0,0,0,0,0,1,1013,0,1,1,0,0,0,0,0,1,0,1012,0],
                    [0,0,0,0,1,1,0,0,0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,0,0,0,0,1,0,0,0],
                    [0,0,1013,0,0,1,1,0,0,1,1,1012,0,1,1,1,1,1,1,0,1013,1,0,1,1,0,0,0,1,1012,0,0],
                    [0,0,0,0,1013,0,1,1,1,1012,1,0,0,0,0,0,0,0,0,0,0,1,1013,0,1,1,1,1012,1,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,1017,0,0,0,0,1016,1,1,1,0,0,0,0,1,1,1,1017,0,1,0,0,1016,1,1,1,0,0],
                    [0,0,0,1017,0,0,0,0,0,0,0,1,1016,1,1,1,1,1,1,1017,1,0,1,1,0,0,0,1,1016,0,0,0],
                    [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,1,0],
                    [0,0,1017,0,0,0,0,0,0,0,0,0,0,1016,0,0,0,0,1017,0,1,1,0,0,0,0,1,1,0,1016,1,0],
                    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,1,0],
                    [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,0,0],
                    [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,1,0,0,0],
                    [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
                    [0,0,1013,0,1,1,0,0,0,0,0,0,0,1012,0,0,0,0,1013,0,1,1,0,0,0,0,1,1,0,1012,0,0],
                    [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0],
                    [0,0,0,1013,0,0,1,1,0,0,0,0,1012,0,0,0,0,0,0,1013,0,0,1,1,0,1,0,1,1012,0,0,0],
                    [0,0,0,0,0,1013,0,1,1,1,1012,0,0,0,0,0,0,0,0,0,0,1013,0,1,1,1,1012,1,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'lava',
            drawPriority: 'background',
            hasCustomLogic: true, customLogic: 'voidFlame',
            invertLogic: true,
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,890,892,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,890,892,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,890,892,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,890,892,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,898,905,904,899,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,887,887,887,887,905,891,891,904,887,887,887,887,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,895,895,895,895,901,891,891,900,895,895,895,895,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,902,901,900,903,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,890,892,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,890,892,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0,890,892,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,0,0,0,0,890,892,0,0,0,0,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
        {
            key: 'field',
            drawPriority: 'background',
            grid: {
                w: 32,
                h: 32,
                tiles: [
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                    [0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
                    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,0,1,1,1,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                ],
            },
        },
    ],
    objects: [
        {status: "normal", id: "voidStone", x: 88, y: 128, type: "enemy", enemyType: "voidStone", d: "down", params: {}, saveStatus: "forever", hasCustomLogic: true, customLogic: "voidStone", invertLogic: true},
        {status: "normal", id: "voidFlame", x: 376, y: 128, type: "enemy", enemyType: "voidFlame", d: "down", params: {}, saveStatus: "forever", hasCustomLogic: true, customLogic: "voidFlame", invertLogic: true},
        {status: "normal", id: "voidFrost", x: 104, y: 368, type: "enemy", enemyType: "voidFrost", d: "down", params: {}, saveStatus: "forever", hasCustomLogic: true, customLogic: "voidFrost", invertLogic: true},
        {status: "normal", id: "voidStorm", x: 360, y: 368, type: "enemy", enemyType: "voidStorm", d: "down", params: {}, saveStatus: "forever", hasCustomLogic: true, customLogic: "voidStorm", invertLogic: true},
        {status: "normal", id: "voidStoneExit", x: 104, y: 80, type: "teleporter", hasCustomLogic: true, customLogic: "voidStone"},
        {status: "normal", id: "voidFlameExit", x: 392, y: 80, type: "teleporter", hasCustomLogic: true, customLogic: "voidFlame"},
        {status: "normal", id: "voidStormExit", x: 376, y: 320, type: "teleporter", hasCustomLogic: true, customLogic: "voidStorm"},
        {status: "normal", id: "voidFrostExit", x: 120, y: 320, type: "teleporter", hasCustomLogic: true, customLogic: "voidFrost"},
    ],
    sections: [
        {x: 0, y: 0, w: 32, h: 32, index: 471, mapId: 'void', floorId: '1F', mapX: 3, mapY: 2},
    ],
};
zones.void = {
    key: 'void',
    areaSize: {w: 32, h: 32},
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
