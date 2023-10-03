import { variantHash } from 'app/content/variants/variantHash';
import { variantSeed } from 'app/gameConstants';
import { everyArea } from 'app/utils/every';
import SRandom from 'app/utils/SRandom';

const baseVarientRandom = SRandom.seed(variantSeed);

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

export function applyVariantsToArea(area: AreaInstance): void {
    for (const variantData of (area.definition.variants || [])) {
        let variantRandom = baseVarientRandom.addSeed(variantData.seed);
        const definition = variantHash[variantData.type];
        const style = chooseStyleVariant(definition.styles, variantRandom, variantData);
        definition.applyToArea(style, variantRandom, area, variantData);
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
    const variantData = getVariantById(variantId);
    let variantRandom = baseVarientRandom.addSeed(variantData.seed);
    const definition = variantHash[variantData.type];
    const style = chooseStyleVariant(definition.styles, variantRandom, variantData);
    return definition.getLogic(style, variantRandom, variantData);
}
