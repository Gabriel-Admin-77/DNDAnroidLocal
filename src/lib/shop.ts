/**
 * Merchant Shop module.
 *
 * Catalogue of purchasable weapons, armor, potions, scrolls, and rare items.
 * Handles character gold balance persistence and inventory integration.
 */

export interface ShopItem {
    id: string;
    name: string;
    category: 'weapon' | 'armor' | 'potion' | 'scroll' | 'material';
    price: number;
    description: string;
    minLevel: number;
    icon: string;
}

export const SHOP_CATALOGUE: ShopItem[] = [
    // Weapons
    { id: 'longsword-plus-1', name: 'Longsword +1', category: 'weapon', price: 150, description: '+1 bonus to attack and damage rolls.', minLevel: 1, icon: '⚔️' },
    { id: 'elven-bow', name: 'Elven Longbow', category: 'weapon', price: 220, description: 'Increases range and critical hit chance.', minLevel: 2, icon: '🏹' },
    { id: 'flame-tongue-dagger', name: 'Flame Tongue Dagger', category: 'weapon', price: 450, description: 'Deals an extra 1d6 fire damage on hit.', minLevel: 4, icon: '🗡️' },

    // Armor
    { id: 'studded-leather', name: 'Studded Leather Armor', category: 'armor', price: 120, description: 'Base AC 12 + Dex modifier.', minLevel: 1, icon: '🛡️' },
    { id: 'mithral-chainmail', name: 'Mithral Chainmail', category: 'armor', price: 350, description: 'Base AC 16. Does not impose stealth disadvantage.', minLevel: 3, icon: '⛓️' },
    { id: 'shield-of-warding', name: 'Shield of Warding', category: 'armor', price: 280, description: '+2 AC and +1 on saving throws.', minLevel: 2, icon: '🛡️' },

    // Potions
    { id: 'greater-health-potion', name: 'Greater Healing Potion', category: 'potion', price: 60, description: 'Restores 4d4+4 HP.', minLevel: 1, icon: '🧪' },
    { id: 'potion-heroism', name: 'Potion of Heroism', category: 'potion', price: 150, description: 'Grants temporary HP and advantage on attack rolls.', minLevel: 3, icon: '🍷' },
    { id: 'elixir-stamina', name: 'Elixir of Stamina', category: 'potion', price: 80, description: 'Fully restores class charges.', minLevel: 1, icon: '⚡' },

    // Scrolls & Magic
    { id: 'scroll-fireball', name: 'Scroll of Fireball', category: 'scroll', price: 200, description: 'Unleash a fiery explosion dealing 8d6 damage.', minLevel: 3, icon: '📜' },
    { id: 'scroll-revivify', name: 'Scroll of Revivify', category: 'scroll', price: 500, description: 'Revives a fallen ally with 1 HP.', minLevel: 5, icon: '✨' },

    // Rare Materials
    { id: 'dragon-scale', name: 'Red Dragon Scale', category: 'material', price: 180, description: 'Rare crafting material for fire-resistant gear.', minLevel: 3, icon: '🐉' },
    { id: 'shadow-essence', name: 'Shadow Essence', category: 'material', price: 140, description: 'Infuses weapons with necrotic damage.', minLevel: 2, icon: '🔮' }
];

const GOLD_STORAGE_KEY = 'dnd_app_player_gold';

export function getPlayerGold(): number {
    if (typeof window === 'undefined') return 100;
    try {
        const raw = localStorage.getItem(GOLD_STORAGE_KEY);
        return raw !== null ? parseInt(raw, 10) : 100;
    } catch {
        return 100;
    }
}

export function updatePlayerGold(delta: number): number {
    if (typeof window === 'undefined') return 100;
    const current = getPlayerGold();
    const next = Math.max(0, current + delta);
    try {
        localStorage.setItem(GOLD_STORAGE_KEY, String(next));
    } catch {
        // ignore
    }
    return next;
}
