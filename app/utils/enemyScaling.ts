


export function scaleEnemy<T>(definition: EnemyDefinition<T>, targetDifficulty: number): EnemyDefinition<T> {
    
    return {
        ...definition
    };
}

export function scaleEnemyAbility<T>(ability: EnemyAbility<T>, targetDifficulty: number): EnemyAbility<T> {
    return {
        ...ability,
    };
}
