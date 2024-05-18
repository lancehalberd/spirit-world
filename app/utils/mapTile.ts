import { allTiles } from 'app/content/tiles';


// Grass maps to this floor tile.
const spiritGround = 1114;
const spiritDustGround = 190;
const spiritCrystalGroundSquare = 1005;
const spiritCrystalGround = 1007;

// Maps specific parent tile indexes to  child tile indexes.
const explicitIndexMapping: number[] = [];

// Thorns don't persist in spirit world
explicitIndexMapping[5] = 0;
// Map grass to spirit dust
explicitIndexMapping[11] = spiritDustGround;
// Grass plants
for (let i = 12; i <= 21; i++) {
    explicitIndexMapping[i] = 0
}
// Desert plants
for (let i = 1420; i <= 1432; i++) {
    explicitIndexMapping[i] = 0
}

// Sky
explicitIndexMapping[262] = spiritCrystalGround;
// This is used a lot in the holy sanctum currently.
explicitIndexMapping[spiritCrystalGround] = spiritCrystalGround;
// This is used a lot in the sky palace currently.
explicitIndexMapping[spiritCrystalGroundSquare] = spiritCrystalGroundSquare;


//const logged: boolean[] = [];

export function mapTileIndex(tileIndex: number): number {
    if (tileIndex < 2) {
        return tileIndex;
    }
    if (typeof explicitIndexMapping[tileIndex] === 'number') {
        return explicitIndexMapping[tileIndex];
    }
    return mapTile(allTiles[tileIndex])?.index || 0;
}

// Maps a tile set in the parent area to the default tile that should be used in the child area.
// For example, a liftable rock in the normal world is mapped to a liftable crystal in the spirit world.
export function mapTile(baseTile?: FullTile): FullTile|null {
    if (!baseTile) {
        return null;
    }

    if (typeof explicitIndexMapping[baseTile.index] === 'number') {
        return allTiles[explicitIndexMapping[baseTile.index]];
    }


    // Tiles with linked offsets map to different tiles than the parent definition.
    const linkedOffset = baseTile?.behaviors?.linkedOffset || 0;
    if (linkedOffset) {
        explicitIndexMapping[baseTile.index] = baseTile.index + linkedOffset;
        // uncomment this if you ever want a list of all linkedOffsets being used.
        /*if (!logged[baseTile.index]) {
            console.log(`explicitIndexMapping[${baseTile.index}] = ${baseTile.index + linkedOffset};`);
            logged[baseTile.index] = true;
        }*/
        return allTiles[baseTile.index + linkedOffset];
    }

    if (baseTile.behaviors?.shallowWater || baseTile.behaviors?.water) {
        explicitIndexMapping[baseTile.index] = spiritCrystalGround;
        return allTiles[spiritCrystalGround];
    }

    if (baseTile.behaviors?.defaultLayer === 'floor' && !baseTile.behaviors?.pit) {
        explicitIndexMapping[baseTile.index] = spiritGround;
        return allTiles[spiritGround];
    }
    explicitIndexMapping[baseTile.index] = baseTile.index;
    return baseTile;
}

setTimeout(() => {
    for (let i = 0; i < allTiles.length; i++) {
        mapTile(allTiles[i]);
    }
}, 100);
