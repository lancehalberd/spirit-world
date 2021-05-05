import { allTiles } from 'app/content/tiles';

import { TilePalette } from 'app/types';

const everything: TilePalette = [[]];
let x = 0, y = 0;
for (let i = 0; i < allTiles.length; i++) {
    if (!everything[y]) {
        everything[y] = [];
    }
    everything[y][x++] = i;
    if (x >= 16) {
        y++;
        x = 0;
    }
}

export const palettes = {
    everything,
};
