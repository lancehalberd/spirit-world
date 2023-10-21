import { zones } from 'app/content/zones/zoneHash';
import { variantSeed } from 'app/gameConstants';
import { generateRoomAndLogic } from 'app/generator/generateRoomAndLogic';
import srandom from 'app/utils/SRandom';

const baseVariantRandom = srandom.seed(variantSeed);


const materialArea: AreaDefinition = {
    w: 32,
    h: 32,
    layers: [],
    objects: [],
    sections: [
        {x: 0, y: 0, w: 16, h: 32, mapId: 'overworld'},
        {x: 16, y: 0, w: 16, h: 32, mapId: 'overworld'},
    ],
};
const spiritArea: AreaDefinition = {
    parentDefinition: materialArea,
    isSpiritWorld: true,
    layers: [],
    objects: [],
    sections: materialArea.sections.map(s => ({...s})),
};
zones.warPalaceWestRoom = {
    key: 'warPalaceWestRoom',
    floors: [
        {
            grid: [[materialArea]],
            spiritGrid: [[spiritArea]],
        },
    ],
};


function getAreaContext(area: AreaDefinition, alternateArea: AreaDefinition) {
    const baseArea = area.parentDefinition ? alternateArea : area;
    const childArea = area.parentDefinition ? area : alternateArea;
    return { area, alternateArea, baseArea, childArea};
}


const { logicNodes } = generateRoomAndLogic({
    random: baseVariantRandom,
    zoneId: 'warPalaceWestRoom',
    roomId: 'room',
    ...getAreaContext( spiritArea, materialArea),
    section: spiritArea.sections[0],
    rules: {
        entrances: [{
            id: 'warPalaceWestDoor',
            targetZone: 'overworld',
            targetObjectId: 'warPalaceWestDoor',
            direction: 'down',
            type: 'door',
        }],
        checks: [{
            id: 'warPalaceWestPeachPiece',
            lootType: 'peachOfImmortalityPiece',
            // Currently only a single requirement will be respected at the room level.
            requiredItemSets: [['teleportation']],
        }],
        style: 'stone',
    }
});
spiritArea.sections[0].mapId = 'overworld';
spiritArea.sections[0].entranceId = 'warPalaceWestDoor';
spiritArea.sections[0].index = 500;

export const warPalaceWestRoomNodes = logicNodes;
