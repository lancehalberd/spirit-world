import {isLogicValid} from 'app/content/logic';
import {variantHash} from 'app/content/variants/variantHash';
import {everyArea} from 'app/utils/every';
import SRandom from 'app/utils/SRandom';

const baseVariantRandom = (state: GameState) => SRandom.seed(state.variantSeed);

function chooseStyleVariant(styles: string[], random: SRandom, data: VariantData) {
    if (!data.styleWeights) {
        return styles[0];
    }
    let sum = 0;
    for (const style of styles) {
        sum += data.styleWeights[style] || 0;
    }
    const roll = random.random() * sum;
    sum = 0;
    for (const style of styles) {
        sum += data.styleWeights[style] || 0;
        if (roll < sum) {
            return style;
        }
    }
    return styles[0];
}

export function getVariantRandom(state: GameState, seedData: VariantSeedData): SRandom {
    // Fixed variants do not depend on the base variant seed.
    if (seedData.fixed) {
        return SRandom.seed(seedData.seed || 0);
    }
    // Non-fixed variants depend on the base variant seed.
    return baseVariantRandom(state).addSeed(seedData.seed || 0);
}

export function applyVariantsToArea(state: GameState, area: AreaInstance): void {
    for (const variantData of (area.definition.variants || [])) {
        const variantRandom = getVariantRandom(state, variantData);
        const definition = variantHash[variantData.type];
        const style = chooseStyleVariant(definition.styles, variantRandom, variantData);
        definition.applyToArea(style, variantRandom, state, area, variantData);
    }
}

let variantMap: {[key: string]: VariantData};
function getVariantById(variantId: string) {
    if (!variantMap) {
        variantMap = {};
        everyArea((location, zone, area) => {
            for (const variantData of (area.variants || [])) {
                variantMap[variantData.id] = variantData;
            }
        });
    }
    return variantMap[variantId];
}

export function variantLogic(variantId: string): LogicCheck {
    return (state: GameState) => {
        const variantData = getVariantById(variantId);
        if (!variantData) {
            debugger;
        }
        const definition = variantHash[variantData.type];
        if (!definition) {
            throw new Error(variantData.type + " variant type not found");
        }
        const variantRandom = getVariantRandom(state, variantData);
        const style = chooseStyleVariant(definition.styles, variantRandom, variantData);
        return isLogicValid(state, definition.getLogic(style, variantRandom, variantData));
    }
}
