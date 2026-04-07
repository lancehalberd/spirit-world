import {generateZoneVariations} from 'app/generator/generateZoneVariations';
import {getAllNodes} from 'app/randomizer/allNodes';
import {calculateKeyLogic} from 'app/randomizer/calculateKeyLogic';
import {
    findLootObjects,
} from 'app/randomizer/find';
import {applyLootAssignments, initializeReverseFill, replaceTrash, reverseFill} from 'app/randomizer/reverseFill';
import {mainOverworldNode} from 'app/randomizer/logic/overworldLogic';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {sceneHash} from 'app/scenes/sceneHash';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {fillRect, pad} from 'app/utils/index';
import {returnToSpawnLocation} from 'app/utils/returnToSpawnLocation';
import {drawText} from 'app/utils/simpleWhiteFont';
import SRandom from 'app/utils/SRandom';

const MARGIN = 20;

const WIDTH = CANVAS_WIDTH - 3 * MARGIN;
const ROW_HEIGHT = 20;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

type RandomizerStep = 'initialize'|'entrances'|'items'|'enemies'|'finished'|'failure';
const randomizerSteps: RandomizerStep[] = ['initialize', 'entrances', 'items', 'enemies', 'finished'];
interface RandomizerConfig {
    goal: RandomizerGoal
    enemySeed?: number
    entranceSeed?: number
    itemSeed?: number
}
export class RandomizerScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    config: RandomizerConfig;
    step: RandomizerStep = 'initialize';
    stepStatus: string = '';
    initialize(state: GameState, config: RandomizerConfig) {
        this.config = config;
        this.step = 'initialize';
        this.stepStatus = 'Initializing';
        state.variantSeed = this.config.itemSeed ?? 0;
        // We need to run generateZoneVariations after setting variantSeed but before
        // generating allNodes, since it will update the generated logic nodes.
        // When we have more zones to generate, we will probably need to add this as
        // a distinct step so that we can generate zones over multiple frames.
        generateZoneVariations(state);
        state.randomizerState = {
            allNodes: getAllNodes(state),
            allChecks: new Set<string>(),
            lootAssignmentByKey: {},
            dialogueReplacements: {},
            checksByZone: {},
            dungeonItemCountByZone: {},
            logicalZoneKeyByCheckKey: {},
            goal: config.goal,
            startingNodes: [mainOverworldNode],
        };
        this.startNextStep(state);
    }
    startNextStep(state: GameState) {
        let stepIndex = randomizerSteps.indexOf(this.step) + 1;
        while (stepIndex < randomizerSteps.length) {
            switch (randomizerSteps[stepIndex]) {
                case 'entrances':
                    if (this.config.entranceSeed) {
                        this.step = 'entrances';
                        // randomizeEntrances(SRandom.seed(entranceSeed));
                    }
                    break;
                case 'items':
                    if (this.config.itemSeed) {
                        this.step = 'items';
                        state.randomizerState.random = SRandom.seed(this.config.itemSeed);
                    }
                    break;
                case 'enemies':
                    if (this.config.enemySeed) {
                        this.step = 'enemies';
                        /*
                        const enemyRandom = SRandom.seed(enemySeed)
                        everyObject((location, zone, area, object) => {
                            if (object.type === 'enemy') {
                                object.enemyType = enemyRandom.element([...enemyTypes]);
                                enemyRandom.generateAndMutate();
                            }
                        });
                        */
                    }
                    break;
                case 'finished':
                    updateHeroMagicStats(state, true);

                    returnToSpawnLocation(state);
                    showFieldScene(state);
                    break;
            }
            stepIndex++;
        }
    }
    update(state: GameState, interactive: boolean) {
        switch (this.step) {
            case 'items':
                try {
                    this.updateItems(state);
                } catch (e) {
                    this.step = 'failure';
                    console.error('Failed item generation', e);
                }
                break;
        }
    }
    updateItems(state: GameState) {
        const randomizerState = state.randomizerState;
        if (!randomizerState.requiredKeysMap) {
            this.stepStatus = 'Counting Keys';
            randomizerState.requiredKeysMap = calculateKeyLogic(randomizerState.allNodes, randomizerState.startingNodes);
            return;
        }
        if (!randomizerState.allLootObjects) {
            this.stepStatus = 'Creating Pool.';
            randomizerState.allLootObjects = findLootObjects(randomizerState.allNodes);
            const lootMap: {[key: string]: LootType } = {};
            for (const lootWithLocation of randomizerState.allLootObjects) {
                if (lootMap[lootWithLocation.lootObject.id] &&
                    lootMap[lootWithLocation.lootObject.id] !== lootWithLocation.lootObject.lootType) {
                    console.warn('Duplicate loot id with mismatched type',
                        lootWithLocation.lootObject.id,
                        lootMap[lootWithLocation.lootObject.id], '!=', lootWithLocation.lootObject.lootType
                    );
                }
                lootMap[lootWithLocation.lootObject.id] = lootWithLocation.lootObject.lootType;
            }
            return;
        }
        if (!randomizerState.lootAssignments) {
            this.stepStatus = 'Adding Victory Points.';
            randomizerState.lootAssignments = {};
            if (randomizerState.goal.victoryPoints?.total) {
                replaceTrash(randomizerState);
            }
        }
        if (!randomizerState.assignmentsState) {
            this.stepStatus = 'Preparing Reverse Fill.';
            initializeReverseFill(randomizerState);
            return;
        }
        if (!reverseFill(randomizerState, 1)) {
            this.stepStatus = 'Assigning Items ' + randomizerState.remainingLoot.length;
            return;
        }
        applyLootAssignments(randomizerState);
        this.startNextStep(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        context.save();
        context.globalAlpha = 0.5;
        fillRect(context, {x:0, y:0, w:CANVAS_WIDTH, h:CANVAS_HEIGHT}, 'black');
        context.restore();

        let statusLines = ['Generating Random Seed'];
        if (this.step === 'entrances') {
            statusLines.push('Randomizing entrances');
        } else {
            statusLines.push('Randomizing items');
        }
        if (this.stepStatus) {
            statusLines.push(this.stepStatus);
        }

        // Draw status in black box with white border.
        const h = ROW_HEIGHT * statusLines.length + 8;
        let r = {
            x: MARGIN * 1.5,
            y: MARGIN * 1.5,
            w: WIDTH,
            h,
        };
        fillRect(context, r, 'white');
        fillRect(context, pad(r, -2), 'black');

        r = pad(r, -4);
        let x = r.x, y = r.y + ROW_HEIGHT / 2;
        for (const statusLine of statusLines) {
            drawText(context, statusLine, x, y, textOptions);
            y += ROW_HEIGHT;
        }
    }
}
sceneHash.randomizer = new RandomizerScene();

export function showRandomizerScene(state: GameState, config: RandomizerConfig) {
    sceneHash.randomizer.initialize(state, config);
    state.sceneStack = [sceneHash.randomizer];
}
