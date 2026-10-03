/**
 * FLAIL! ↔ Item Piles integration.
 *
 * A small, optional bridge module: when Item Piles is active, it registers
 * the FLAIL! system with Item Piles so GMs can use loot piles, merchants and
 * vaults. Installing + enabling this module is the opt-in; a world setting
 * lets a GM turn the integration off without uninstalling.
 *
 * Nothing here touches the FLAIL system itself — it only hands Item Piles a
 * description of how FLAIL stores items, prices, quantities and coins, via
 * the documented `game.itempiles.API.addSystemIntegration(config)` call on
 * the `item-piles-ready` hook.
 */

const MODULE_ID = "flail-item-piles";
const SYSTEM_ID = "flail";

/**
 * Item Piles system-integration config for FLAIL!.
 *
 * Key mappings (verified against the FLAIL data model):
 *   - Item quantity → `system.quantity` (every FLAIL item has it).
 *   - Item price    → `system.cost`.
 *   - Coins         → the character attribute `system.coins` (primary currency).
 *
 * The pile actor type is `character` because that is the only FLAIL actor
 * type carrying `system.coins`, so merchant piles can hold money. Item Piles
 * uses its own inventory UI for piles, so the character sheet's slot rules
 * don't get in the way. Looted items arrive on a player's character as
 * `location: "unequipped"` and show in the sheet's loose/unequipped tray.
 */
const FLAIL_ITEM_PILES_CONFIG = {
  VERSION: "1.0.0",

  // Piles/merchants are created as FLAIL characters (only actor type with coins).
  ACTOR_CLASS_TYPE: "character",

  // Default item types Item Piles reaches for in its create-item flows.
  ITEM_CLASS_LOOT_TYPE: "gear",
  ITEM_CLASS_WEAPON_TYPE: "weapon",
  ITEM_CLASS_EQUIPMENT_TYPE: "armour",

  // Where quantity and price live on a FLAIL item.
  ITEM_QUANTITY_ATTRIBUTE: "system.quantity",
  ITEM_PRICE_ATTRIBUTE: "system.cost",

  // Hide the non-physical / non-lootable item types from pile inventories.
  ITEM_FILTERS: [
    {
      path: "type",
      filters: "spell,prayer,gift,talent,gadget,feature,condition,background,combatTalent,combatTree,religion,master,guild"
    }
  ],

  // Two items are "the same" (stackable) when name + type match.
  ITEM_SIMILARITIES: ["name", "type"],

  // Gear/consumables stack by quantity; wearables carry usage dots and must
  // stay distinct, so never merge them into a quantity stack.
  UNSTACKABLE_ITEM_TYPES: ["weapon", "armour", "instrument"],

  // FLAIL's single coin pool, as an actor attribute.
  CURRENCIES: [
    {
      type: "attribute",
      name: "Coins",
      img: "icons/commodities/currency/coin-embossed-skull-gold.webp",
      abbreviation: "{#} coins",
      data: { path: "system.coins" },
      primary: true,
      exchangeRate: 1
    }
  ]
};

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Enable Item Piles integration",
    hint: "Register FLAIL! with Item Piles (loot piles, merchants, vaults). Turn off to disable the bridge without uninstalling. Reload the world after changing.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });
  game.settings.register(MODULE_ID, "autoStow", {
    name: "Auto-stow looted items into slots",
    hint: "When a character loots an item from an Item Piles pile, automatically place it into a free inventory slot (stashed first, then worn, then carried) instead of the loose tray. Two-slot items, locked slots and zone rules are respected; if there's no room the item stays in the loose tray.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false
  });
});

/**
 * Auto-stow looted items. Item Piles fires `item-piles-addItems` on every
 * client with (targetUuid, itemDeltas, userId, interactionId) once items have
 * been added to the recipient. We let only the initiating client act, resolve
 * the newly added items on the target character, and hand them to the system's
 * slot-placement helper. Needs no slot logic of its own.
 */
Hooks.on("item-piles-addItems", async (targetUuid, itemDeltas, userId) => {
  try {
    if (game.system?.id !== SYSTEM_ID) return;
    if (!game.settings.get(MODULE_ID, "enabled")) return;
    if (!game.settings.get(MODULE_ID, "autoStow")) return;
    if (game.user?.id !== userId) return;                       // one client only
    if (typeof game.flail?.stowItems !== "function") return;    // system too old

    const doc = await fromUuid(targetUuid);
    const actor = doc?.actor ?? doc;                            // Actor or TokenDocument
    if (!actor || actor.type !== "character") return;           // only characters have slots

    const items = (itemDeltas ?? [])
      .map(d => actor.items.get(d?.item?._id ?? d?.item?.id ?? d?._id ?? d?.id))
      .filter(Boolean);
    if (!items.length) return;

    await game.flail.stowItems(actor, items, { order: ["satchel", "body", "hands"] });
  } catch (err) {
    console.error(`${MODULE_ID} | auto-stow of looted items failed`, err);
  }
});

Hooks.once("item-piles-ready", async () => {
  if (game.system?.id !== SYSTEM_ID) {
    console.warn(`${MODULE_ID} | active system is "${game.system?.id}", not "${SYSTEM_ID}" — integration skipped.`);
    return;
  }
  if (!game.settings.get(MODULE_ID, "enabled")) {
    console.log(`${MODULE_ID} | integration disabled in settings — skipped.`);
    return;
  }
  try {
    await game.itempiles.API.addSystemIntegration(FLAIL_ITEM_PILES_CONFIG);
    console.log(`${MODULE_ID} | FLAIL! registered with Item Piles.`);
    if (game.user?.isGM) {
      ui.notifications?.info("FLAIL! ↔ Item Piles: integration active.");
    }
  } catch (err) {
    console.error(`${MODULE_ID} | failed to register the FLAIL system integration`, err);
    if (game.user?.isGM) {
      ui.notifications?.error("FLAIL! ↔ Item Piles: failed to register — see the console (F12).");
    }
  }
});
