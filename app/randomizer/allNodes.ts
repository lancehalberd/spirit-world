import { peachCaveNodes } from 'app/randomizer/logic/peachCaveLogic';
import { cavesNodes, holyCityNodes, treeVillageNodes, waterfallCaveNodes } from 'app/randomizer/logic/otherLogic'
import { overworldNodes, underwaterNodes, skyNodes } from 'app/randomizer/logic/overworldLogic';
import { tombNodes } from 'app/randomizer/logic/tombLogic';
import { warTempleNodes } from 'app/randomizer/logic/warTempleLogic';
import { cocoonNodes } from 'app/randomizer/logic/cocoonLogic';
import { helixNodes } from 'app/randomizer/logic/helixLogic';
import { forestTempleNodes } from 'app/randomizer/logic/forestTempleLogic';
import { waterfallTowerNodes } from 'app/randomizer/logic/waterfallTower';
import { forgeNodes } from 'app/randomizer/logic/forgeLogic';
import { grandTempleNodes } from 'app/randomizer/logic/grandTempleLogic';
import { skyPalaceNodes } from 'app/randomizer/logic/skyPalaceLogic';
import { riverTempleNodes, riverTempleWaterNodes } from 'app/randomizer/logic/riverTempleLogic';
import { craterNodes } from 'app/randomizer/logic/craterLogic';
import { staffTowerNodes } from 'app/randomizer/logic/staffTower';
import { labNodes } from 'app/randomizer/logic/labLogic';
import { treeNodes, voidNodes } from 'app/randomizer/logic/treeLogic';

export const allNodes = [
    ...overworldNodes,
    ...cavesNodes,
    ...underwaterNodes,
    ...skyNodes,
    ...waterfallCaveNodes,
    ...peachCaveNodes,
    ...treeVillageNodes,
    ...holyCityNodes,
    ...tombNodes,
    ...warTempleNodes,
    ...cocoonNodes,
    ...helixNodes,
    ...forestTempleNodes,
    ...waterfallTowerNodes,
    ...forgeNodes,
    ...grandTempleNodes,
    ...skyPalaceNodes,
    ...riverTempleNodes,
    ...riverTempleWaterNodes,
    ...craterNodes,
    ...staffTowerNodes,
    ...labNodes,
    ...treeNodes,
    ...voidNodes,
];
