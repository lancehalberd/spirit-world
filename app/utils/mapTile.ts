import { allTiles } from 'app/content/tiles';


// Grass maps to this floor tile.
const spiritGround = 1114;
const spiritDustGround = 190;
const spiritCrystalGroundSquare = 1005;
const spiritCrystalGround = 1007;
const spiritCrystalSmoothGround = 1009;

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
// Desert sand+plants
for (let i = 1403; i <= 1440; i++) {
    explicitIndexMapping[i] = 0
}
// Full sand tile.
explicitIndexMapping[1407] = spiritGround;
// Carpet
for (let i = 251; i <= 259; i++) {
    explicitIndexMapping[i] = 0
}
// Garden Plot+Crops
for (let i = 272; i <= 288; i++) {
    explicitIndexMapping[i] = 0
}
// Garden Flowers
for (let i = 318; i <= 335; i++) {
    explicitIndexMapping[i] = 0
}



// Sky
explicitIndexMapping[262] = spiritCrystalGround;
// This is used a lot in the holy sanctum currently.
explicitIndexMapping[spiritCrystalGround] = spiritCrystalGround;
// This is used a lot in the sky palace currently.
explicitIndexMapping[spiritCrystalGroundSquare] = spiritCrystalGroundSquare;
explicitIndexMapping[spiritCrystalSmoothGround] = spiritCrystalSmoothGround;


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
    const linkedIndex = baseTile?.behaviors?.linkedIndex;
    if (linkedIndex !== undefined) {
        return allTiles[linkedIndex];
    }
    const linkedOffset = baseTile?.behaviors?.linkedOffset;
    if (linkedOffset !== undefined) {
        explicitIndexMapping[baseTile.index] = baseTile.index + linkedOffset;
        // uncomment this if you ever want a list of all linkedOffsets being used.
        /*if (!logged[baseTile.index]) {
            console.log(`explicitIndexMapping[${baseTile.index}] = ${baseTile.index + linkedOffset};`);
            logged[baseTile.index] = true;
        }*/
        return allTiles[baseTile.index + linkedOffset];
    }

    // Never implicitly map mask tiles to other tiles.
    if (baseTile.behaviors.maskFrame) {
        return baseTile;
    }

    if (baseTile.behaviors?.shallowWater || baseTile.behaviors?.water) {
        explicitIndexMapping[baseTile.index] = spiritCrystalGround;
        return allTiles[spiritCrystalGround];
    }

    if (baseTile.behaviors?.defaultLayer === 'floor' && !baseTile.behaviors?.pit && !baseTile.behaviors?.pitMap) {
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
