import { CrystalSwitch } from 'app/content/objects/crystalSwitch';
import { FloorSwitch } from 'app/content/objects/floorSwitch';
import { variantHash } from 'app/content/variants/variantHash';
import {
    hasSpiritBarrier, orLogic,
    hasFire, hasIce, hasLightning,
    hasStaff, hasClone
} from 'app/content/logic';
import { addObjectToArea } from 'app/utils/objects';
import { getSwitchTargetIds } from 'app/utils/switches';

interface SwitchFields {
    targetObjectId: string
}

function addCrystalSwitch(state: GameState, area: AreaInstance, data: VariantData<SwitchFields>, style: string, suffix: string, x: number, y: number) {
    let element: MagicElement = null;
    let timer = 0;
    if (style === 'burst') {
        timer = 100;
    }
    if (style === 'flame') {
        element = 'fire';
    } else if (style === 'frost') {
        element = 'ice';
    } else if (style === 'storm') {
        element = 'lightning';
    }
    const switchObject = new CrystalSwitch(state, {
        type: 'crystalSwitch',
        id: `${data.id}-${suffix}`,
        status: 'normal',
        x,
        y,
        targetObjectId: data.fields?.targetObjectId,
        element,
        spirit: area.definition.isSpiritWorld,
        timer,
        // The burst version can only be used with doors if this is set,
        // otherwise the door will instantly close even after you hit all switches.
        stayOnAfterActivation: style === 'burst',
    });
    switchObject.alwaysReset = true;
    addObjectToArea(state, area, switchObject);
}
function addFloorTile(state: GameState, area: AreaInstance, data: VariantData<SwitchFields>, style: string, suffix: string, x: number, y: number) {
    const switchObject = new FloorSwitch(state, {
        type: 'floorSwitch',
        id: `${data.id}-${suffix}`,
        status: 'normal',
        x,
        y,
        toggleOnRelease: true,
        targetObjectId: data.fields?.targetObjectId,
        spirit: area.definition.isSpiritWorld,
    })
    switchObject.alwaysReset = true;
    addObjectToArea(state, area, switchObject);
}

variantHash.switch = {
    styles: ['burst', 'flame', 'frost', 'storm', 'tile', 'fourTiles'],
    fields: [
        {
            key: 'targetObjectId',
            defaultValue: '',
            getValues(state: GameState) {
                return getSwitchTargetIds(state.areaInstance);
            },
        },
    ],
    gridSize: 4,
    applyToArea(style: string, random: SRandom, state: GameState, area: AreaInstance, data: VariantData<SwitchFields>): boolean {
        switch (style){
            case 'burst': {
                addCrystalSwitch(state, area, data, style, 'switch1', data.x + data.w / 2 - 8, data.y + data.h / 2 - 40);
                addCrystalSwitch(state, area, data, style, 'switch2', data.x + data.w / 2 - 8, data.y + data.h / 2 + 24);
                addCrystalSwitch(state, area, data, style, 'switch3', data.x + data.w / 2 - 40, data.y + data.h / 2 - 8);
                addCrystalSwitch(state, area, data, style, 'switch4', data.x + data.w / 2 + 24, data.y + data.h / 2 - 8);
                return true;
            }
            case 'flame':
            case 'frost':
            case 'storm': {
                const x = random.range(data.x, data.x + data.w - 16);
                random.generateAndMutate();
                const y = random.range(data.y, data.y + data.h - 16);
                addCrystalSwitch(state, area, data, style, 'switch', x, y);
                return true;
            }
            case 'tile': {
                const x = random.range(data.x, data.x + data.w - 16);
                random.generateAndMutate();
                const y = random.range(data.y, data.y + data.h - 16);
                addFloorTile(state, area, data, style, 'switch', x, y);
                return true;
            }
            case 'fourTiles': {
                if (data.w >= data.h) {
                    const cx = data.x + data.w / 2;
                    const y = random.range(data.y, data.y + data.h - 16);
                    addFloorTile(state, area, data, style, 'switch', cx - 32, y);
                    addFloorTile(state, area, data, style, 'switch', cx - 16, y);
                    addFloorTile(state, area, data, style, 'switch', cx, y);
                    addFloorTile(state, area, data, style, 'switch', cx + 16, y);
                } else {
                    const x = random.range(data.x, data.x + data.w - 16);
                    const cy = data.y + data.h / 2;
                    addFloorTile(state, area, data, style, 'switch', x, cy - 32);
                    addFloorTile(state, area, data, style, 'switch', x, cy - 16);
                    addFloorTile(state, area, data, style, 'switch', x, cy);
                    addFloorTile(state, area, data, style, 'switch', x, cy + 16);
                }
                return true;
            }
        }
        return false;
    },
    getLogic(style: string, random: SRandom, data: VariantData<SwitchFields>): LogicCheck {
        switch (style){
            case 'burst': return hasSpiritBarrier;
            case 'flame': return hasFire;
            case 'frost': return hasIce;
            case 'storm': return hasLightning;
            case 'tile': return orLogic(hasStaff, hasClone);
            case 'fourTiles': return orLogic(hasStaff);
        }
    },
};
