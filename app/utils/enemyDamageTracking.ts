const enemyDamageStats: {[key in EnemyType|BossType|MinionType]?: EnemyDamageTrackingStats} = {};
window.enemyDamageStats = enemyDamageStats;

function getEnemyDamageStats(enemy: Enemy): EnemyDamageTrackingStats {
    enemyDamageStats[enemy.definition.enemyType] = enemyDamageStats[enemy.definition.enemyType] || {
        damageDealtByEnemy: 0,
        burningDamageDealtByEnemy: 0,
        damageDealtToEnemy: 0,
        numberDefeated: 0,
    };
    return enemyDamageStats[enemy.definition.enemyType];
}
export function trackEnemyTookDamage(enemy: Enemy, damage: number) {
    const stats = getEnemyDamageStats(enemy);
    stats.damageDealtToEnemy += Math.min(enemy.life, damage);
    if (enemy.life <= damage) {
        stats.numberDefeated++;
    }
}
export function trackEnemyDealtDamage(enemy: Enemy, damage: number, burningDamage = 0) {
    const stats = getEnemyDamageStats(enemy);
    stats.damageDealtByEnemy += damage;
    stats.burningDamageDealtByEnemy += burningDamage;
}
