import {bossNames, isBossDefeated} from 'app/utils/bosses';
import {typedKeys} from 'app/utils/types';

function getTotalBossPoints(randomizerState: RandomizerState) {
    let bossPoints = 0;
    const bossKeys = typedKeys(randomizerState.goal?.bossPoints.bossPoints) ?? [];
    for (const bossKey of bossKeys) {
        bossPoints += randomizerState.goal.bossPoints.bossPoints[bossKey];
    }
    return bossPoints;
}
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
        const totalBossPoints = getTotalBossPoints(randomizerState);
        const bossKeys = typedKeys(randomizerState.goal?.bossPoints.bossPoints);
        if (totalBossPoints === bossPointGoal) {
            // Don't mention boss points if the goal requires defeating all bosses.
            for (const bossKey of bossKeys) {
                if (!isBossDefeated(state, bossKey)) {
                    requirements.push('Defeat ' + bossNames[bossKey]);
                }
            }
        } else {
            requirements.push(`Claim ${bossPointGoal} more boss points`);
            for (const bossKey of bossKeys) {
                if (!isBossDefeated(state, bossKey)) {
                    requirements.push(randomizerState.goal.bossPoints.bossPoints[bossKey] + 'pt ' + bossNames[bossKey]);
                }
            }
        }
    }
    const victoryPointGoal = randomizerState.goal?.victoryPoints?.goal;
    if (victoryPointGoal && state.hero.savedData.collectibles.victoryPoint < victoryPointGoal) {
        requirements.push(`Find ${victoryPointGoal} victory points`);
    }
    return requirements;
}
