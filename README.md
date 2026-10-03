# FLAIL! — Item Piles Integration

An **optional** bridge module that registers the [FLAIL!](https://github.com/reubentaylor/flail-system) game system with [Item Piles](https://github.com/fantasycalendar/FoundryVTT-ItemPiles). Install and enable it only if your table wants Item Piles features — **loot piles, merchants and vaults** — with FLAIL. It is not required to play FLAIL.

## What it does
On load it tells Item Piles how FLAIL stores items so its UI works out of the box:

- **Quantity** → `system.quantity`
- **Price** → `system.cost`
- **Coins** → the character attribute `system.coins` (the primary — and only — currency)
- **Pile actors** are created as FLAIL **characters** (the only actor type with coins, so merchants can hold money)
- **Lootable** item types: weapons, armour, gear, instruments. Non-physical types (spells, prayers, gifts, talents, gadgets, features, conditions, backgrounds, combat talents/trees, religions, masters, guilds) are hidden from pile inventories.
- **Weapons, armour and instruments** are kept unstackable (they carry usage dots); gear and consumables stack by quantity.

It changes **nothing** in the FLAIL system — it only passes Item Piles a configuration object via the documented `game.itempiles.API.addSystemIntegration()` call.

## Requirements
- Foundry VTT **v13+** (verified v14)
- The **FLAIL!** system (`flail`) active in the world
- The **Item Piles** module (`item-piles`) installed and enabled

## Install
1. Install **Item Piles** (its own manifest).
2. Install this module from its manifest:
   ```
   https://github.com/reubentaylor/flail-item-piles/releases/latest/download/module.json
   ```
3. In your FLAIL world, enable **both** modules under **Manage Modules**, then reload.

## Use
Once active, use Item Piles exactly as documented:
- **Drop an item** onto the canvas to create a loot pile.
- Turn a token/actor into a **merchant** or **vault** via its Item Piles configuration.
- Players loot by opening the pile; looted items land on their character (unequipped — they appear in the sheet's loose tray, ready to slot).
- Coins move through the **Coins** currency, backed by `system.coins`.

## Turning it off
A world setting — **Configure Settings → FLAIL! Item Piles Integration → "Enable Item Piles integration"** — lets a GM disable the bridge without uninstalling. Reload after changing.

## Notes
- FLAIL's inventory is slot-based on the character sheet; Item Piles uses its own inventory UI for piles/merchants, so slots don't constrain pile contents. Looted gear carries its usage dots.
- If the active system isn't FLAIL, the module does nothing.

---
FLAIL! © Andre Novoa / Games Omnivorous. Item Piles © Fantasy Calendar / Wasp. This bridge is fan-made.
