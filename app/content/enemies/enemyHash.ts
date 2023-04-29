
import { EnemyDefinition, EnemyType, BossType, MinionType } from 'app/types';

export const enemyDefinitions: {[key in EnemyType | BossType | MinionType]?: EnemyDefinition<any>} = {};
window['enemyDefinitions'] = enemyDefinitions;
