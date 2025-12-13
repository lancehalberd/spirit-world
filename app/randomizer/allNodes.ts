import {peachCaveNodes} from 'app/randomizer/logic/peachCaveLogic';
import {cavesNodes, holyCityNodes, waterfallCaveNodes} from 'app/randomizer/logic/otherLogic'
import {treeVillageNodes, forestNodes} from 'app/randomizer/logic/forestLogic'
import {overworldNodes, underwaterNodes, skyNodes} from 'app/randomizer/logic/overworldLogic';
import {grandTempleNodes} from 'app/randomizer/logic/grandTempleLogic';
import {tombNodes} from 'app/randomizer/logic/tombLogic';
import {warTempleNodes} from 'app/randomizer/logic/warTempleLogic';
import {cocoonNodes} from 'app/randomizer/logic/cocoonLogic';
import {dreamNodes} from 'app/randomizer/logic/dreamLogic';
import {helixNodes} from 'app/randomizer/logic/helixLogic';
import {gauntletNodes} from 'app/randomizer/logic/gauntletLogic';
import {forestTempleNodes} from 'app/randomizer/logic/forestTempleLogic';
import {waterfallTowerNodes} from 'app/randomizer/logic/waterfallTower';
import {forgeNodes} from 'app/randomizer/logic/forgeLogic';
import {skyPalaceNodes} from 'app/randomizer/logic/skyPalaceLogic';
import {holySanctumNodes} from 'app/randomizer/logic/holySanctumLogic';
import {riverTempleNodes, riverTempleWaterNodes} from 'app/randomizer/logic/riverTempleLogic';
import {craterNodes} from 'app/randomizer/logic/craterLogic';
import {staffTowerNodes} from 'app/randomizer/logic/staffTower';
import {labNodes} from 'app/randomizer/logic/labLogic';
import {treeNodes, voidNodes} from 'app/randomizer/logic/treeLogic';
import {warPalaceWestRoomNodes} from 'app/generator/content/warPalaceWestRoom';

export const allNodes = [
    ...overworldNodes,
    ...cavesNodes,
    ...underwaterNodes,
    ...skyNodes,
    ...waterfallCaveNodes,
    ...forestNodes,
    ...treeVillageNodes,
    ...holyCityNodes,
    ...grandTempleNodes,
    ...peachCaveNodes,
    ...tombNodes,
    ...warTempleNodes,
    ...cocoonNodes,
    ...dreamNodes,
    ...helixNodes,
    ...gauntletNodes,
    ...forestTempleNodes,
    ...waterfallTowerNodes,
    ...forgeNodes,
    ...skyPalaceNodes,
    ...holySanctumNodes,
    ...riverTempleNodes,
    ...riverTempleWaterNodes,
    ...craterNodes,
    ...staffTowerNodes,
    ...labNodes,
    ...treeNodes,
    ...voidNodes,
    ...warPalaceWestRoomNodes,
];
