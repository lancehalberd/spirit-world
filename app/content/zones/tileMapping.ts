import { zones } from 'app/content/zones/zoneHash';
import { allTiles } from 'app/content/tiles';
import { mapTile } from 'app/utils/mapTile';

function createTileMapping() {
    const w = 100;
    const h = Math.ceil(2 * allTiles.length / w);
    const area: AreaDefinition = {
        layers: [
            {
                key: 'floor',
                grid: {
                    w,
                    h,
                    tiles: [

                    ],
                },
            },
        ],
        objects: [],
        sections: [
            {x: 0, y: 0, w, h, mapX: 0, mapY: 0},
        ],
    };
    zones.tileMapping = {
        key: 'tileMapping',
        areaSize: {w, h},
        floors: [
            {
                grid: [
                    [area,],
                ],
                spiritGrid: [
                    [],
                ],
            },
        ],
    };
    const tiles = area.layers[0].grid.tiles;
    for (let i = 0; i < allTiles.length; i++) {
        const x = (2 * i) % w;
        const y = Math.floor(2 * i / w);
        tiles[y] = tiles[y] || [];
        tiles[y][x] = i;
        tiles[y][x + 1] = mapTile(allTiles[i])?.index || 0;
    }
}

// Delay this slightly to be certain allTiles is finished being defined before we used it.
setTimeout(createTileMapping, 100);
