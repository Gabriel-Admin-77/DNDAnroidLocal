import { Character, InventoryItem } from './types';
import { getModifier } from './rpg-rules';

const CLASS_IMAGE_MAP: Record<string, string> = {
    Rogue: '/images/champion-rogue.png',
    Cleric: '/images/champion-cleric.png',
    Paladin: '/images/champion-paladin.png',
    Ranger: '/images/champion-ranger.png',
    Wizard: '/images/champion-wizard.png',
    Fighter: '/images/champion-fighter.png',
    Barbarian: '/images/champion-barbarian.png',
    Bard: '/images/champion-bard.png',
    Druid: '/images/champion-druid.png',
    Monk: '/images/champion-monk.png',
    Sorcerer: '/images/champion-sorcerer.png',
    Warlock: '/images/champion-warlock.png',
};

export function getChampionImage(character: { image_url?: string | null; class?: string | null }): string {
    if (character.image_url && !character.image_url.startsWith('http')) return character.image_url;
    return CLASS_IMAGE_MAP[character.class || ''] || '/images/default-champion.png';
}

export function calculateAC(character: Character, equippedItems: InventoryItem[] = []): number {
    const dexMod = getModifier(character.dexterity || 10);

    const equippedArmor = equippedItems.find(i => i.item_type === 'armor' && i.is_equipped);
    const equippedShield = equippedItems.find(i => i.item_name.toLowerCase().includes('shield') && i.is_equipped);

    let baseAC = 10 + dexMod;

    if (equippedArmor) {
        const name = equippedArmor.item_name.toLowerCase();
        if (name.includes('plate')) {
            baseAC = 18;
        } else if (name.includes('chain mail') || name.includes('chainmail')) {
            baseAC = 16;
        } else if (name.includes('scale') || name.includes('breastplate') || name.includes('half plate')) {
            baseAC = 14 + Math.min(dexMod, 2);
        } else if (name.includes('studded')) {
            baseAC = 12 + dexMod;
        } else if (name.includes('leather')) {
            baseAC = 11 + dexMod;
        } else {
            baseAC = 12 + dexMod;
        }
    } else {
        switch (character.class) {
            case 'Barbarian':
                baseAC = 10 + getModifier(character.constitution || 10) + dexMod;
                break;
            case 'Monk':
                baseAC = 10 + getModifier(character.wisdom || 10) + dexMod;
                break;
            case 'Wizard':
            case 'Sorcerer':
            case 'Druid':
            case 'Bard':
            case 'Warlock':
                baseAC = 10 + dexMod;
                break;
            case 'Cleric':
            case 'Paladin':
                baseAC = 16;
                break;
            case 'Fighter':
            case 'Ranger':
                baseAC = 16 + Math.min(dexMod, 2);
                break;
            case 'Rogue':
                baseAC = 12 + Math.min(dexMod, 2);
                break;
            default:
                baseAC = 10 + dexMod;
        }
    }

    if (equippedShield) {
        baseAC += 2;
    }

    return baseAC;
}

// Re-exported from rpg-rules so existing imports of `getModifier` from
// `@/lib/utils` keep working.
export { getModifier };

