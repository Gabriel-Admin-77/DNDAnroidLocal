/**
 * Smoke tests for the pure functions in rpg-rules.ts.
 * Run with: npx tsx src/lib/rpg-rules.test.ts
 *
 * Tiny on-purpose — the project doesn't have a test runner installed
 * yet, so this file just exercises the logic and asserts in plain
 * TypeScript. The build already typechecks it, so a green run
 * confirms the rules engine works as expected.
 */

import {
    getLevelForXp,
    getXpForLevel,
    getHitDieForClass,
    getHpGainOnLevelUp,
    rollHitDieForShortRest,
    getModifier
} from './rpg-rules';

let passed = 0;
let failed = 0;

function assertEq<T>(actual: T, expected: T, label: string) {
    if (actual === expected) {
        passed++;
        console.log(`  ✓ ${label}`);
    } else {
        failed++;
        console.error(`  ✗ ${label}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(cond: boolean, label: string) {
    if (cond) {
        passed++;
        console.log(`  ✓ ${label}`);
    } else {
        failed++;
        console.error(`  ✗ ${label}`);
    }
}

console.log('getLevelForXp:');
assertEq(getLevelForXp(0), 1, '0 XP -> level 1');
assertEq(getLevelForXp(299), 1, '299 XP -> level 1');
assertEq(getLevelForXp(300), 2, '300 XP -> level 2');
assertEq(getLevelForXp(900), 3, '900 XP -> level 3');
assertEq(getLevelForXp(64000), 10, '64000 XP -> level 10');
assertEq(getLevelForXp(355000), 20, '355000 XP -> level 20');
assertEq(getLevelForXp(1000000), 20, 'huge XP -> clamped at 20');

console.log('\ngetXpForLevel:');
assertEq(getXpForLevel(1), 0, 'level 1 -> 0 XP');
assertEq(getXpForLevel(5), 6500, 'level 5 -> 6500 XP');
assertEq(getXpForLevel(20), 355000, 'level 20 -> 355000 XP');

console.log('\ngetHitDieForClass:');
assertEq(getHitDieForClass('Fighter'), 10, 'Fighter d10');
assertEq(getHitDieForClass('Wizard'), 6, 'Wizard d6');
assertEq(getHitDieForClass('Barbarian'), 12, 'Barbarian d12');
assertEq(getHitDieForClass('Rogue'), 8, 'Rogue d8');
assertEq(getHitDieForClass(null), 8, 'null class -> d8 default');
assertEq(getHitDieForClass('Mystery'), 8, 'unknown class -> d8 default');

console.log('\ngetHpGainOnLevelUp:');
// Wizard with 14 CON (+2): per level = avg(6/2+1=4) + 2 = 6; +2 levels = 12.
const wizardUp = getHpGainOnLevelUp('Wizard', 14, 2);
assertEq(wizardUp, 12, 'Wizard d6 +2 CON, 2 levels -> 12 HP');
// Barbarian d12 avg=7, CON 12 (+1): per level 8, +3 levels = 24.
const barbUp = getHpGainOnLevelUp('Barbarian', 12, 3);
assertEq(barbUp, 24, 'Barbarian d12 +1 CON, 3 levels -> 24 HP');
// Level delta 0 -> no gain.
assertEq(getHpGainOnLevelUp('Fighter', 10, 0), 0, '0 levels -> 0 HP');

console.log('\nrollHitDieForShortRest:');
const r1 = rollHitDieForShortRest('Fighter', 14);
assertTrue(r1.total >= 1, 'short-rest heal at least 1');
assertTrue(r1.constitutionMod === 2, 'con mod +2 for CON 14');
assertTrue(r1.roll >= 1 && r1.roll <= 10, 'Fighter d10 stays in 1..10');

console.log('\ngetModifier:');
assertEq(getModifier(10), 0, 'score 10 -> +0');
assertEq(getModifier(14), 2, 'score 14 -> +2');
assertEq(getModifier(8), -1, 'score 8 -> -1');
assertEq(getModifier(20), 5, 'score 20 -> +5');
assertEq(getModifier(1), -5, 'score 1 -> -5');

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
