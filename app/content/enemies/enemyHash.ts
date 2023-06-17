

export const enemyDefinitions: {[key in EnemyType | BossType | MinionType]?: EnemyDefinition<any>} = {};
window['enemyDefinitions'] = enemyDefinitions;
