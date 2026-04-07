import {bossNames, isBossDefeated} from 'app/utils/bosses';
import {typedKeys} from 'app/utils/types';


function getBossPoints(randomizerState: RandomizerState, state: GameState): number {
    let bossPoints = 0;
    const bossKeys = typedKeys(randomizerState.goal?.bossPoints.bossPoints) ?? [];
    for (const bossKey of bossKeys) {
        if (isBossDefeated(state, bossKey)) {
            bossPoints += randomizerState.goal.bossPoints.bossPoints[bossKey];
        }
    }
    return bossPoints;
}

export function getPendingRandomizerGoals(randomizerState: RandomizerState, state: GameState): string[] {
    const requirements: string[] = [];
    const bossPointGoal = randomizerState.goal?.bossPoints?.goal;
    if (bossPointGoal && getBossPoints(randomizerState, state) < bossPointGoal) {
        const bossKeys = typedKeys(randomizerState.goal?.bossPoints.bossPoints);
        if (bossKeys.length === 1 && !isBossDefeated(state, bossKeys[0])) {
            requirements.push('Defeat ' + bossNames[bossKeys[0]]);
        } else if (bossKeys.length > 1) {
            requirements.push(`Claim ${bossPointGoal} boss points`);
        }
    }
    const victoryPointGoal = randomizerState.goal?.victoryPoints?.goal;
    if (victoryPointGoal && state.hero.savedData.collectibles.victoryPoint < victoryPointGoal) {
        requirements.push(`Find ${victoryPointGoal} victory points`);
    }
    return requirements;
}
