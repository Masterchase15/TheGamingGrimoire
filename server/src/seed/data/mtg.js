import { keywordAbilities, keywordActions, abilityWords } from './mtg-keywords.js';

const t = (term, definition, grp) => ({ term, definition, grp });

export default {
  slug: 'magic-the-gathering',
  steam_appid: 2141910,
  title: 'Magic: The Gathering',
  category: 'card',
  tagline: 'The original trading card game of planeswalkers, mana and spells.',
  description:
    'Magic: The Gathering is a strategy trading card game where two or more players take the role of planeswalkers — powerful mages who cast spells, summon creatures and wield artifacts drawn from their decks. Designed by Richard Garfield and first released in 1993, it remains the largest TCG in the world, playable in paper and digitally through MTG Arena and Magic Online.',
  aliases: ['MTG', 'Magic', 'MTG Arena', 'Commander', 'EDH'],
  genres: ['Trading Card Game', 'Strategy', 'Fantasy'],
  platforms: ['Tabletop', 'PC', 'Mobile'],
  developer: 'Wizards of the Coast',
  publisher: 'Wizards of the Coast',
  release_year: 1993,
  players: '2+',
  play_time: '20–120 min',
  age: '13+',
  is_continuous: true,
  featured: true,
  hue: 28,
  sections: [
    {
      slug: 'overview',
      title: 'What Is Magic?',
      icon: 'Sparkle',
      summary: 'The pitch: what you do, how you win, and why people love it.',
      content: `
## You are a planeswalker
In Magic, each player is a **planeswalker** — a wizard who can travel between worlds. Your **deck** is your arsenal of spells. Lands give you **mana**, mana lets you cast spells, and spells let you summon creatures, destroy threats, draw cards and bend the rules of the game.

## How you win
Each player starts at **20 life** (40 in Commander). You win when:
- Your opponent's life total reaches **0**
- Your opponent must draw a card from an **empty library**
- Your opponent has **10 or more poison counters**
- A card says you win (yes, those exist)

## Why it's special
- **Endless variety.** Over 27,000 unique cards exist, and new sets release several times a year.
- **Deckbuilding is half the game.** You design your own strategy before you ever sit down.
- **Many ways to play.** One-on-one tournaments, casual four-player Commander, drafting a deck from fresh booster packs, or online with MTG Arena.

## The five colors
Every card is tied to one or more of five colors — **White, Blue, Black, Red and Green** — or is colorless. Each color has its own philosophy and strengths. See **Colors & Mana** for the full breakdown.

## Where to start
1. Read **How to Play** for the turn structure and core rules.
2. Grab a starter or precon deck (Commander precons are a great entry point).
3. Try **MTG Arena** — it teaches the rules interactively and is free to play.
4. Look up any word you don't recognize in **Keyword Abilities** and **Game Terms & Slang**.
`,
    },
    {
      slug: 'how-to-play',
      title: 'How to Play Magic',
      icon: 'BookOpen',
      summary: 'Setup, turn structure, mana, combat and the stack — everything you need for your first game.',
      content: `
## Setup
1. Each player brings a deck — **at least 60 cards** in most formats (Commander uses exactly 100).
2. Shuffle and draw **7 cards**. Starting life is **20**.
3. Decide who goes first (roll a die). The player who goes first **skips their first draw**.

### Mulligans
Don't like your opening hand? Shuffle it back and draw 7 new cards. Under the **London mulligan**, after you keep a hand you put one card on the bottom of your library for each time you mulliganed.

## Zones
| Zone | What's there |
|---|---|
| **Library** | Your deck, face down |
| **Hand** | Cards you can play; hidden from opponents |
| **Battlefield** | Permanents in play: lands, creatures, artifacts, enchantments, planeswalkers, battles |
| **Graveyard** | Discard pile for used spells and destroyed permanents (public) |
| **Stack** | Where spells and abilities wait to resolve |
| **Exile** | Cards removed from the game, usually for good |
| **Command zone** | Commanders, emblems and special game cards |

## Mana and lands
- You may play **one land per turn**, during your main phase, when the stack is empty.
- **Tap** a land (turn it sideways) to add mana. Basic lands make one mana of their color: Plains {W}, Island {U}, Swamp {B}, Mountain {R}, Forest {G}.
- A card's **mana cost** is in its top right. {2}{R} means two mana of any type plus one red.
- Unused mana empties at the end of each step and phase.

## Turn structure
### 1. Beginning phase
- **Untap** — untap all your permanents.
- **Upkeep** — "at the beginning of your upkeep" abilities trigger.
- **Draw** — draw a card.

### 2. First main phase
Play a land, cast creatures and other spells, activate abilities.

### 3. Combat phase
- **Beginning of combat**
- **Declare attackers** — tap the creatures you're attacking with and choose which player, planeswalker or battle each attacks.
- **Declare blockers** — the defending player assigns untapped creatures to block. One blocker can block one attacker; several blockers can gang up on one attacker.
- **Combat damage** — each creature deals damage equal to its **power**. Unblocked attackers hit the player. A creature dies when damage marked on it equals or exceeds its **toughness**.
- **End of combat**

### 4. Second main phase
Same as the first. It's often smart to cast creatures *after* combat so your opponent has less information while blocking.

### 5. Ending phase
- **End step** — "at the beginning of the end step" triggers.
- **Cleanup** — discard down to **seven cards**; damage wears off creatures.

## Summoning sickness
A creature can't attack or use {T} abilities unless you've controlled it continuously since the start of your most recent turn. **Haste** ignores this.

## Spell speed
- **Sorcery speed:** creatures, sorceries, artifacts, enchantments, planeswalkers, battles — only during *your* main phase with an empty stack.
- **Instant speed:** instants, abilities and anything with **flash** — any time you have priority, including on your opponent's turn.

## The stack
When you cast a spell or activate an ability, it goes on the **stack**. Players can respond with instants and abilities, which go on top. When everyone passes in a row, the **top** item resolves first ("last in, first out").

> **Example:** You cast a creature. Your opponent responds with a counterspell. You respond with a spell that protects your spell. Resolution order: your protection, then their counterspell (which now fails), then your creature.

## Triggered, activated and static abilities
- **Activated:** "[Cost]: [Effect]" — you choose when to use it.
- **Triggered:** "When / Whenever / At…" — happens automatically when the event occurs.
- **Static:** always on, like "Creatures you control get +1/+1."

## The golden rules
1. **If a card contradicts the rules, the card wins.**
2. **"Can't" beats "can."**
3. If an effect asks you to do something impossible, do as much as you can.
4. Active player, non-active player (APNAP): when things happen at the same time, the active player handles theirs first.
`,
    },
    {
      slug: 'card-types',
      title: 'Card Types',
      icon: 'Cards',
      summary: 'Lands, creatures, instants, sorceries, artifacts, enchantments, planeswalkers, battles and kindred.',
      content: `
## Anatomy of a card
- **Name** and **mana cost** across the top.
- **Art**, then the **type line** (e.g. *Legendary Creature — Elf Druid*).
- **Set symbol** — its color shows rarity: black (common), silver (uncommon), gold (rare), orange-red (mythic).
- **Text box** — rules text, plus italic reminder text and flavor text.
- **Power/Toughness** in the bottom corner for creatures; **loyalty** for planeswalkers; **defense** for battles.

## Permanent types
| Type | What it does |
|---|---|
| **Land** | Played (not cast), one per turn. Produces mana. Basics: Plains, Island, Swamp, Mountain, Forest (plus Wastes). |
| **Creature** | Attacks and blocks. Has power/toughness. Subject to summoning sickness. |
| **Artifact** | Colorless-friendly objects. Subtypes include **Equipment**, **Vehicle**, **Food**, **Treasure**, **Clue**. |
| **Enchantment** | Ongoing magical effects. **Auras** attach to things; **Sagas** tell a story chapter by chapter; **Rooms**, **Cases** and **Classes** are newer subtypes. |
| **Planeswalker** | Powerful allies with loyalty abilities — activate one per turn at sorcery speed. Can be attacked. |
| **Battle** | Enter under an opponent's protection (Sieges). Attack them to reduce defense; defeat them to flip them. |

## Non-permanent types
| Type | What it does |
|---|---|
| **Instant** | Cast any time you have priority. Resolves, then goes to the graveyard. |
| **Sorcery** | Cast only in your main phase with an empty stack. |

## Supertypes and other types
- **Legendary** — the "legend rule": if you control two legendary permanents with the same name, choose one and put the other in the graveyard.
- **Basic** — basic lands; you may run any number in most formats.
- **Snow** — interacts with snow-matters cards.
- **World** — only one World permanent may exist at a time (old mechanic).
- **Kindred** (formerly Tribal) — a non-creature card with creature types, e.g. *Kindred Instant — Elf*.
- **Tokens** — permanents created by effects. They cease to exist if they leave the battlefield.

## Double-faced and special cards
- **Transforming double-faced cards** flip between faces.
- **Modal double-faced cards (MDFCs)** let you choose which face to play.
- **Split cards**, **Adventures**, **Omens**, **Flip cards** and **Prototype** cards pack two options into one card.
`,
    },
    {
      slug: 'colors-and-mana',
      title: 'Colors & Mana',
      icon: 'Drop',
      summary: 'The color pie, what each color is good at, and the names of every two- and three-color combination.',
      content: `
## The color pie
Magic's five colors are arranged in a circle — **W U B R G**. Colors next to each other are **allies**; colors across are **enemies**.

| Color | Symbol | Philosophy | Strengths | Weaknesses |
|---|---|---|---|---|
| **White** | {W} | Order, community, law | Small creatures, lifegain, board wipes, removal of enchantments & artifacts, taxes | Card draw, big creatures |
| **Blue** | {U} | Knowledge, logic, perfection | Card draw, counterspells, bounce, flyers, copying | Removing permanents permanently |
| **Black** | {B} | Ambition, power at any cost | Creature removal, tutors, reanimation, drain, sacrifice | Dealing with enchantments & artifacts |
| **Red** | {R} | Freedom, emotion, impulse | Burn spells, haste, fast aggression, artifact destruction, temporary card advantage | Enchantments, long games |
| **Green** | {G} | Nature, growth, tradition | Big creatures, ramp (extra lands), fight, removing artifacts & enchantments | Flyers, card draw-from-nothing |
| **Colorless** | {C} | — | Artifacts and Eldrazi that fit any deck | — |

## Mana symbols
- **Hybrid** {W/U}: pay with either color.
- **Phyrexian** {W/P}: pay one white mana or 2 life.
- **Generic** {2}: any type of mana.
- **{C}**: specifically colorless mana (e.g. from Wastes).
- **{X}**: you choose a number and pay that much.
- **{S}**: snow mana.

## Color combination names
The names below come from famous guilds, shards, wedges and families in Magic's history. See the list underneath for each one.
`,
      terms: [
        t('Azorius (WU)', 'White-Blue. Control, flyers, law and order. From the Ravnica guild.', 'Two-Color (Guilds)'),
        t('Dimir (UB)', 'Blue-Black. Spies, mill, card advantage and removal.', 'Two-Color (Guilds)'),
        t('Rakdos (BR)', 'Black-Red. Aggression, sacrifice and chaos.', 'Two-Color (Guilds)'),
        t('Gruul (RG)', 'Red-Green. Big, fast, hasty creatures.', 'Two-Color (Guilds)'),
        t('Selesnya (GW)', 'Green-White. Go-wide tokens, counters and enchantments.', 'Two-Color (Guilds)'),
        t('Orzhov (WB)', 'White-Black. Lifedrain, aristocrats (sacrifice) and taxing.', 'Two-Color (Guilds)'),
        t('Izzet (UR)', 'Blue-Red. Spellslinging, instants and sorceries, artifacts.', 'Two-Color (Guilds)'),
        t('Golgari (BG)', 'Black-Green. Graveyard recursion, value and sacrifice.', 'Two-Color (Guilds)'),
        t('Boros (RW)', 'Red-White. Aggressive combat and equipment.', 'Two-Color (Guilds)'),
        t('Simic (GU)', 'Green-Blue. Ramp, +1/+1 counters and card draw.', 'Two-Color (Guilds)'),
        t('Esper (WUB)', 'White-Blue-Black. Control and artifacts. A shard from Alara.', 'Three-Color (Shards)'),
        t('Grixis (UBR)', 'Blue-Black-Red. Spells, removal and reanimation.', 'Three-Color (Shards)'),
        t('Jund (BRG)', 'Black-Red-Green. Midrange value and sacrifice.', 'Three-Color (Shards)'),
        t('Naya (RGW)', 'Red-Green-White. Big creatures and go-wide aggression.', 'Three-Color (Shards)'),
        t('Bant (GWU)', 'Green-White-Blue. Counters, flicker and tempo.', 'Three-Color (Shards)'),
        t('Abzan (WBG)', 'White-Black-Green. +1/+1 counters and grindy value. A wedge from Tarkir.', 'Three-Color (Wedges)'),
        t('Jeskai (URW)', 'Blue-Red-White. Spells, prowess and tempo.', 'Three-Color (Wedges)'),
        t('Sultai (BGU)', 'Black-Green-Blue. Graveyard value and control.', 'Three-Color (Wedges)'),
        t('Mardu (RWB)', 'Red-White-Black. Aggressive tokens and sacrifice.', 'Three-Color (Wedges)'),
        t('Temur (GUR)', 'Green-Blue-Red. Big spells, ramp and flash.', 'Three-Color (Wedges)'),
        t('Yore-Tiller / Artifice (WUBR)', 'Every color except green. Also called "Non-Green".', 'Four-Color'),
        t('Glint-Eye / Chaos (UBRG)', 'Every color except white. Also called "Non-White".', 'Four-Color'),
        t('Dune-Brood / Aggression (BRGW)', 'Every color except blue. Also called "Non-Blue".', 'Four-Color'),
        t('Ink-Treader / Altruism (RGWU)', 'Every color except black. Also called "Non-Black".', 'Four-Color'),
        t('Witch-Maw / Growth (GWUB)', 'Every color except red. Also called "Non-Red".', 'Four-Color'),
        t('WUBRG (Five-Color)', 'All five colors. Pronounced "woo-burg".', 'Five-Color'),
      ],
    },
    {
      slug: 'commander',
      title: 'How to Play Commander',
      icon: 'Crown',
      summary: 'The most popular way to play: 100-card singleton decks led by a legendary commander.',
      content: `
## What is Commander?
**Commander** (also called **EDH**, "Elder Dragon Highlander") is a casual multiplayer format, usually played with **four players**. Each player builds a 100-card deck around a legendary creature — their **commander** — and battles everyone else in a free-for-all.

## Deck rules
- **Exactly 100 cards**, including your commander.
- **Singleton:** only one copy of each card, except basic lands (and cards that say otherwise, like *Relentless Rats*).
- Your commander must be a **legendary creature** (or a card that says it can be your commander, such as certain planeswalkers or backgrounds).
- **Color identity:** every card in your deck must only use mana symbols found in your commander's color identity. Color identity includes mana symbols in the cost *and* rules text, and color indicators.
- Use the official **banned list**.

## Starting the game
- Everyone starts at **40 life**.
- Your commander begins in the **command zone**, face up, visible to everyone.
- Draw 7 cards. The first mulligan in multiplayer is **free** (you don't bottom a card for it).

## Casting your commander
- Cast your commander from the command zone like any other spell.
- **Commander tax:** each time you cast it from the command zone, it costs {2} more for each previous time you cast it from there this game.
- If your commander would go to your **graveyard or exile** (or your hand or library), you may move it back to the command zone instead.

## Commander damage
If a single commander deals **21 or more combat damage** to a player over the course of the game, that player **loses**. Track it separately for each opposing commander.

## Multiplayer etiquette
- **Threat assessment:** attack whoever is most dangerous, not just whoever hit you last.
- **Rule zero:** chat before the game about power level, house rules and playstyles. Most groups talk about deck "brackets" (from casual to cEDH) so games are fair.
- Politics and deals are part of the fun — but deals aren't binding.

## Commander brackets
Wizards publishes a **bracket system** (1–5) to describe power level:
1. **Exhibition** — ultra-casual, theme-first decks.
2. **Core** — roughly the level of an unmodified precon.
3. **Upgraded** — tuned decks with strong synergy and a few powerful cards.
4. **Optimized** — high power with no restrictions except the banned list.
5. **cEDH** — competitive Commander, built purely to win as efficiently as possible.

Game Changer cards (a published list of especially powerful cards), mass land destruction, extra-turn chains and early two-card combos are what usually push a deck into higher brackets.

## Variants
- **Partner / Friends forever / Background** — two commanders sharing one deck.
- **Brawl** — 60 cards (or 100 in Historic Brawl), Standard- or Arena-legal pools, 25/30 life.
- **Oathbreaker** — 60 cards led by a planeswalker plus a "signature spell".
- **Pauper Commander (PDH)** — an uncommon commander and all-common deck.
`,
    },
    {
      slug: 'commander-deckbuilding',
      title: 'Building a Commander Deck',
      icon: 'Hammer',
      summary: 'A step-by-step template for building a fun, functional 100-card Commander deck.',
      content: `
## Step 1: Pick a commander you love
Choose a legendary creature whose **ability excites you**. Your commander is the engine of your deck — everything else should help it shine. Ask: *what does this card want me to do?* (Make tokens? Cast spells? Attack with dragons?)

## Step 2: Decide your game plan
Sum up the deck in one sentence: *"Make lots of tokens and pump them all."* That sentence becomes your filter for every card.

## Step 3: Use the template
A reliable starting point for 99 cards (plus the commander):

| Category | Count | Why |
|---|---|---|
| **Lands** | 36–38 | You need to hit land drops every turn. Lean higher for expensive decks. |
| **Ramp** | 10–12 | Mana rocks (*Sol Ring*, *Arcane Signet*), land ramp (*Cultivate*), mana creatures. |
| **Card draw** | 10 | Repeatable sources are best (*Rhystic Study*-style engines, *Phyrexian Arena*). |
| **Targeted removal** | 8–10 | Answers for single threats: *Swords to Plowshares*, *Beast Within*, *Chaos Warp*. |
| **Board wipes** | 2–4 | Reset buttons for when you fall behind: *Blasphemous Act*, *Farewell*. |
| **Synergy / theme** | ~30 | The cards that execute your plan with your commander. |
| **Win conditions** | 3–5 | How you actually close the game. |

> Cards that do two jobs (removal that draws a card, a creature that ramps) are gold — they free up slots.

## Step 4: Build your mana base
- Count the colored pips in your deck and split basics roughly by that ratio.
- Add dual lands that enter untapped when possible — **Command Tower**, **Exotic Orchard**, pain lands, check lands, fast lands, and **Path of Ancestry** are budget-friendly staples.
- Two-color decks: ~8–12 dual lands. Three or more colors: as many as your budget allows.

## Step 5: Watch your curve
Most cards should cost **2–4 mana**. A good average mana value is **3.0–3.5** for casual decks. Include cheap plays so you're not doing nothing on turns 1–3.

## Step 6: Protect your commander
Commander tax adds up. Include a few ways to protect your general: *Lightning Greaves*, *Swiftfoot Boots*, *Heroic Intervention*, counterspells, or hexproof-granting effects.

## Step 7: Playtest and cut
- Goldfish (play solo) a few opening hands. Can you cast spells by turn 2 or 3?
- Track cards that are always stuck in your hand — cut them.
- Pay attention to what wins and what loses games, and adjust.

## Common mistakes
- **Too few lands.** It's the #1 reason decks fail.
- **Too few answers.** Every table has a scary card. Have ways to deal with it.
- **All theme, no function.** Cute cards are fun, but you still need ramp, draw and removal.
- **Ignoring your bracket.** Build to match the power level of your playgroup.

## Useful tools
- **EDHREC** — shows the most-played cards for any commander.
- **Scryfall** — powerful card search (try queries like \`id<=rg t:creature\`).
- **Moxfield** / **Archidekt** — deckbuilding and playtesting sites.
`,
    },
    {
      slug: 'keywords',
      title: 'Keyword Abilities',
      icon: 'ListMagnifyingGlass',
      summary: 'Every keyword ability that can appear on a card — from Flying to Station — with plain-English definitions.',
      content: `
Keyword abilities are shorthand for longer rules. Most cards print **reminder text** in italics, but older cards and rare printings often don't. Use the search box to jump straight to a keyword.

- **Evergreen** keywords appear in nearly every set.
- **Common & Returning** keywords come back across many sets.
- **Retired / Legacy** keywords mostly appear on older cards.

Looking for verbs like *Scry* or *Mill*? See **Keyword Actions**. Italic words like *Landfall* are **Ability Words**.
`,
      terms: keywordAbilities,
    },
    {
      slug: 'keyword-actions',
      title: 'Keyword Actions',
      icon: 'Lightning',
      summary: 'Verbs with special rules meaning — Scry, Mill, Surveil, Proliferate, Discover and more.',
      content: `
Keyword actions are **verbs** with specific rules meanings. When a card tells you to *scry 2* or *investigate*, this is what it means.
`,
      terms: keywordActions,
    },
    {
      slug: 'ability-words',
      title: 'Ability Words',
      icon: 'TextItalic',
      summary: 'Italic labels like Landfall and Threshold that group similar abilities together.',
      content: `
Ability words are printed in *italics* at the start of an ability, such as *Landfall* — Whenever a land enters under your control… They have **no rules meaning on their own**; they simply label abilities that work in a similar way so they're easy to talk about.
`,
      terms: abilityWords,
    },
    {
      slug: 'formats',
      title: 'Formats',
      icon: 'Trophy',
      summary: 'Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Limited, Commander and more.',
      content: `
## Constructed formats
You build a deck ahead of time from cards you own.

| Format | Card pool | Deck size | Notes |
|---|---|---|---|
| **Standard** | The most recent sets (roughly the last three years) | 60+, 15 sideboard | Rotates every year. The main format of MTG Arena. |
| **Pioneer** | Return to Ravnica (2012) forward | 60+, 15 sideboard | Non-rotating. |
| **Modern** | Eighth Edition (2003) forward | 60+, 15 sideboard | Non-rotating; fast and powerful. |
| **Legacy** | All cards (with a banned list) | 60+, 15 sideboard | Very powerful, eternal format. |
| **Vintage** | All cards (restricted list instead of most bans) | 60+, 15 sideboard | The most powerful format; Power Nine allowed as one-ofs. |
| **Pauper** | Commons only | 60+, 15 sideboard | Budget-friendly and surprisingly deep. |
| **Commander** | All cards (own banned list) | 100, singleton | Multiplayer, 40 life. See **How to Play Commander**. |
| **Brawl** | Standard (or Arena pool for Historic Brawl) | 60 / 100 singleton | Commander-style on Arena. |
| **Historic / Timeless** | Arena-only pools | 60+ | Digital formats on MTG Arena. |

## Limited formats
You build a deck on the spot from packs.
- **Booster Draft:** each player opens a pack, takes one card, and passes it on. Repeat for three packs, then build a **40-card** deck (about 17 lands, 15–17 creatures, removal).
- **Sealed:** open six packs and build a 40-card deck from what you got. The standard format for prerelease events.
- **Cube:** draft from a curated collection of cards, often powerful classics.

## The 40-card Limited template
- **17 lands** (16 for very aggressive decks)
- **15–17 creatures**, with a smooth mana curve
- **Removal** — take it highly
- Two colors is the norm; splash a third only for bombs with fixing.
`,
    },
    {
      slug: 'glossary',
      title: 'Game Terms & Slang',
      icon: 'Translate',
      summary: "Words you'll hear at the table: ETB, value, tempo, card advantage, ramp, tutor, combo and more.",
      content: `
Magic players have a language of their own. Here are the rules terms and community slang you'll run into most often.
`,
      terms: [
        t('Aggro', 'An aggressive deck that tries to win quickly with cheap creatures and direct damage.', 'Strategy'),
        t('Aristocrats', 'A strategy that sacrifices creatures for value, usually draining opponents with death triggers.', 'Strategy'),
        t('Burn', 'Spells that deal direct damage, or a deck built around them.', 'Strategy'),
        t('Card advantage', 'Having access to more cards (resources) than your opponent. Drawing two cards with one spell is "card advantage".', 'Strategy'),
        t('Combo', 'Two or more cards that together win the game or produce an overwhelming advantage, sometimes an infinite loop.', 'Strategy'),
        t('Control', 'A reactive deck that answers threats and wins in the late game.', 'Strategy'),
        t('Midrange', 'A flexible deck with efficient threats and answers that tries to out-value both aggro and control.', 'Strategy'),
        t('Ramp', 'Spells that give you extra mana or lands, letting you cast expensive spells early.', 'Strategy'),
        t('Stax', 'A strategy that restricts what opponents can do (taxing spells, stopping untaps, etc.).', 'Strategy'),
        t('Tempo', 'Using mana and turns more efficiently than your opponent, often by bouncing or countering their plays cheaply.', 'Strategy'),
        t('Tribal / Kindred', 'A deck built around one creature type, like Elves or Dragons.', 'Strategy'),
        t('Voltron', 'Stacking Auras and Equipment on one creature (often your commander) to win with commander damage.', 'Strategy'),
        t('Wheel', 'Each player discards their hand and draws a new one (named after Wheel of Fortune).', 'Strategy'),
        t('Blink / Flicker', 'Exile a permanent and immediately return it, reusing its enter-the-battlefield ability.', 'Strategy'),
        t('Bounce', 'Returning a permanent to its owner\'s hand.', 'Slang'),
        t('Bomb', 'An extremely powerful card, especially in Limited.', 'Slang'),
        t('Brick', 'A card that does nothing in the current situation, or a whiffed reveal.', 'Slang'),
        t('Chump block', 'Blocking with a creature that will die without killing the attacker, just to prevent damage.', 'Slang'),
        t('Dork', 'A small creature that taps for mana, like Llanowar Elves.', 'Slang'),
        t('ETB', 'Enters the battlefield. "ETB trigger" = an ability that triggers when the permanent enters.', 'Slang'),
        t('Fatty', 'A large creature.', 'Slang'),
        t('Goldfishing', 'Playing your deck alone to see how fast it can win against no opposition.', 'Slang'),
        t('Mana screw / flood', 'Screw: not drawing enough lands. Flood: drawing too many.', 'Slang'),
        t('Precon', 'A preconstructed deck sold ready to play.', 'Slang'),
        t('Removal', 'Any card that gets rid of an opponent\'s permanent.', 'Slang'),
        t('Rock', 'A mana-producing artifact, like Sol Ring or Arcane Signet.', 'Slang'),
        t('Sweeper / Wrath / Board wipe', 'A spell that destroys or removes all (or most) creatures.', 'Slang'),
        t('Topdeck', 'The card you draw from the top of your library, especially one you desperately needed.', 'Slang'),
        t('Tutor', 'A card that searches your library for another card (named after Demonic Tutor).', 'Slang'),
        t('Value', 'Getting more out of a card than you paid for it — "that\'s value!"', 'Slang'),
        t('Expend', 'Triggers when you spend your Nth total mana on spells and abilities in a turn (e.g. "Whenever you expend 4").', 'Rules Term'),
        t('Mana value', 'The total amount of mana in a card\'s mana cost, regardless of color (formerly "converted mana cost").', 'Rules Term'),
        t('Priority', 'The right to cast a spell or activate an ability. Players pass priority back and forth; when all pass in a row, the top of the stack resolves.', 'Rules Term'),
        t('Summoning sickness', 'A creature can\'t attack or use {T} abilities until you\'ve controlled it since the start of your turn.', 'Rules Term'),
        t('State-based actions', 'Automatic game checks: a player at 0 life loses, creatures with lethal damage die, the legend rule applies, and so on.', 'Rules Term'),
        t('Token', 'A permanent created by an effect rather than represented by a card. It ceases to exist when it leaves the battlefield.', 'Rules Term'),
        t('Emblem', 'A permanent effect in the command zone, often created by planeswalkers. It can\'t be removed.', 'Rules Term'),
        t('Counter (marker)', 'A marker placed on a permanent or player, such as +1/+1, loyalty, poison or charge counters. Opposite counters (+1/+1 and -1/-1) cancel out.', 'Rules Term'),
        t('Color identity', 'All colors in a card\'s mana cost, rules text mana symbols and color indicator. Used for Commander deckbuilding.', 'Rules Term'),
        t('Sideboard', 'Extra cards (usually 15) you can swap into your deck between games of a match.', 'Rules Term'),
      ],
    },
  ],
};
