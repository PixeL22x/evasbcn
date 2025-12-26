// Icon mapping for ice cream shop products
// Returns Lucide icon names for professional UI

export const ITEM_ICONS = {
    // Helados y Sabores
    bola: 'IceCream',
    bolas: 'IceCream',
    helado: 'IceCream',
    tarrina: 'IceCream',
    cucurucho: 'IceCream',
    cono: 'IceCream',
    sabor: 'IceCream',

    // Bebidas Calientes
    cafe: 'Coffee',
    café: 'Coffee',
    cortado: 'Coffee',
    leche: 'Milk',
    latte: 'Coffee',
    capuchino: 'Coffee',
    americano: 'Coffee',
    te: 'Coffee',
    té: 'Coffee',
    infusion: 'Coffee',

    // Bebidas Frias
    agua: 'Droplet',
    refresco: 'Wine',
    coca: 'Wine',
    fanta: 'Wine',
    sprite: 'Wine',
    pepsi: 'Wine',
    batido: 'Milk',
    shake: 'Milk',
    granizado: 'Snowflake',
    horchata: 'Milk',
    smoothie: 'Milk',
    smoothies: 'Milk',
    milkshake: 'Milk',
    milkshakes: 'Milk',

    // Comida / Snacks
    crep: 'Circle',
    crepe: 'Circle',
    gofre: 'Grid3x3',
    waffle: 'Grid3x3',
    croissant: 'Croissant',
    pasta: 'Croissant',
    bocadillo: 'Sandwich',
    sandwich: 'Sandwich',
    tostada: 'Sandwich',
    churros: 'Cookie',
    churro: 'Cookie',
    xurros: 'Cookie',
    xurro: 'Cookie',
    porras: 'Cookie',

    // Postres
    carrot: 'Cake',
    carrotcake: 'Cake',
    tarta: 'Cake',
    pastel: 'Cake',

    // Otros
    bolsa: 'ShoppingBag',
    propina: 'Coins',
    suplemento: 'Plus',
    topping: 'Sparkles',
};

/**
 * Returns the appropriate Lucide icon name for a given item
 * @param {string} itemName - The name of the product
 * @returns {string} - Lucide icon name
 */
export const getIconForItem = (itemName) => {
    if (!itemName) return 'Receipt';

    const lowerName = itemName.toLowerCase();

    // Special case: items starting with "SM" are smoothies
    if (lowerName.startsWith('sm ') || lowerName.startsWith('sm-')) {
        return 'Milk';
    }

    // Special case: items starting with "MK" are milkshakes
    if (lowerName.startsWith('mk ') || lowerName.startsWith('mk-')) {
        return 'Milk';
    }

    // Buscar coincidencia exacta o parcial
    for (const [key, icon] of Object.entries(ITEM_ICONS)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }

    return 'Receipt'; // Icono por defecto
};
