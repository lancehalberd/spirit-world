import { allTiles } from 'app/content/tiles';


// Grass maps to this floor tile.
const spiritGround = 1114;
const spiritDustGround = 190;
const spiritCrystalGround = 1007;

// Maps specific parent tile indexes to  child tile indexes.
const explicitIndexMapping: number[] = [];

// Thorns don't persist in spirit world
explicitIndexMapping[5] = 0;
// Map grass to spirit dust
explicitIndexMapping[11] = spiritDustGround;
// Currently minor material world plants don't persist
explicitIndexMapping[12] = 0;
explicitIndexMapping[13] = 0;
explicitIndexMapping[14] = 0;
explicitIndexMapping[15] = 0;
explicitIndexMapping[16] = 0;
explicitIndexMapping[17] = 0;
explicitIndexMapping[18] = 0;
explicitIndexMapping[19] = 0;
explicitIndexMapping[20] = 0;
explicitIndexMapping[21] = 0;

// Sky
explicitIndexMapping[262] = spiritCrystalGround;
// This is used a lot in the holy sanctum currently.
explicitIndexMapping[spiritCrystalGround] = spiritCrystalGround;


//const logged: boolean[] = [];

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
        // uncomment this if you ever want a list of all linkedOffsets being used.
        /*if (!logged[baseTile.index]) {
            console.log(`explicitIndexMapping[${baseTile.index}] = ${baseTile.index + linkedOffset};`);
            logged[baseTile.index] = true;
        }*/
        return allTiles[baseTile.index + linkedOffset];
    }

    if (baseTile.behaviors?.shallowWater || baseTile.behaviors?.water) {
        return allTiles[spiritCrystalGround];
    }

    if (baseTile.behaviors?.defaultLayer === 'floor') {
        return allTiles[spiritGround];
    }

    return baseTile;
}

setTimeout(() => {
    for (let i = 0; i < allTiles.length; i++) {
        mapTile(allTiles[i]);
    }
}, 100);
