// Card games other than Magic (which has its own file). TCGs are played
// continuously, so they use the ongoing statuses.

export default [
  {
    slug: 'pokemon-tcg',
    title: 'Pokémon Trading Card Game',
    category: 'card',
    tagline: 'Battle with Pokémon, Trainers and Energy cards.',
    description:
      'Build a 60-card deck of Pokémon, Trainer and Energy cards and battle to take all your Prize cards. Playable in paper and on Pokémon TCG Live.',
    aliases: ['Pokemon TCG', 'PTCG', 'Pokémon', 'Pokemon', 'TCG Live', 'Pocket'],
    genres: ['Trading Card Game', 'Strategy'],
    platforms: ['Tabletop', 'PC', 'Mobile'],
    developer: 'Creatures Inc.',
    publisher: 'The Pokémon Company',
    release_year: 1996,
    players: '2',
    play_time: '20–30 min',
    age: '6+',
    is_continuous: true,
    featured: true,
    hue: 48,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Setup, turns, attacking and winning.',
        content: `
## Setup
- Shuffle your 60-card deck and draw **7 cards**.
- Place a **Basic Pokémon** as your **Active** and up to 5 on your **Bench**. (No Basic? Reveal, reshuffle and redraw; your opponent may draw an extra card.)
- Set aside the top **6 cards as Prize cards**.

## Your turn
1. **Draw** a card.
2. Do any of these, in any order:
   - Put Basic Pokémon on your Bench.
   - **Evolve** Pokémon (not on the turn they were played, and not on either player's first turn).
   - Attach **one Energy** per turn.
   - Play **Item** cards (any number), one **Supporter**, and one **Stadium**.
   - **Retreat** your Active Pokémon once by discarding Energy equal to its Retreat Cost.
   - Use Abilities.
3. **Attack** — this ends your turn. The player going first can't attack on their first turn.

## Winning
- Take all of your **Prize cards** (one per knockout; Pokémon ex and V give 2, VMAX/Mega ex give 3).
- Knock out your opponent's last Pokémon in play.
- Your opponent can't draw at the start of their turn.

## Weakness, resistance and conditions
- **Weakness** usually doubles damage; **resistance** reduces it by 30.
- **Special Conditions:** Asleep, Burned, Confused, Paralyzed and Poisoned.
`,
      },
      {
        slug: 'deckbuilding',
        title: 'Deckbuilding Basics',
        icon: 'Hammer',
        summary: 'Deck ratios and rules.',
        content: `
- Exactly **60 cards**, at most **4 copies** of any card with the same name (except basic Energy).
- A typical competitive ratio: **12–18 Pokémon, 30–36 Trainers, 8–12 Energy**.
- Include **draw Supporters** (like Professor's Research) and **search** cards to find your attackers.
- Standard format uses recent regulation marks; check the current rotation.
`,
      },
    ],
  },
  {
    slug: 'yu-gi-oh',
    steam_appid: 1449850,
    title: 'Yu-Gi-Oh! Trading Card Game',
    category: 'card',
    tagline: "It's time to duel! Summon monsters and activate spells and traps.",
    description:
      'Duelists build decks of monsters, spells and traps to reduce their opponent\'s Life Points from 8000 to 0. Known for its fast combos and many summoning mechanics. Playable in paper, Master Duel and Duel Links.',
    aliases: ['YGO', 'Yugioh', 'Master Duel', 'Duel Links'],
    genres: ['Trading Card Game', 'Strategy'],
    platforms: ['Tabletop', 'PC', 'Mobile', 'Consoles'],
    developer: 'Konami',
    publisher: 'Konami',
    release_year: 1999,
    players: '2',
    play_time: '20–40 min',
    age: '8+',
    is_continuous: true,
    hue: 265,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Phases, summoning types and card types.',
        content: `
## Basics
- Each player starts with **8000 Life Points** and draws **5 cards**. The first player doesn't draw on their first turn.
- **Main Deck:** 40–60 cards. **Extra Deck:** up to 15 (Fusion, Synchro, Xyz, Link). **Side Deck:** up to 15.

## Phases
1. **Draw Phase**
2. **Standby Phase**
3. **Main Phase 1** — summon, set and activate cards.
4. **Battle Phase** — attack with monsters (not on the first turn of the duel).
5. **Main Phase 2**
6. **End Phase**

## Summoning
- **Normal Summon/Set** once per turn: Level 5–6 needs 1 Tribute; Level 7+ needs 2.
- **Special Summons** have no limit: Fusion (Polymerization), Ritual, Synchro (Tuner + non-Tuners), Xyz (same-Level monsters), Pendulum, and Link (Link Rating materials).

## Card types
- **Monsters** (yellow, orange, blue, purple, white, black, green-orange, dark blue)
- **Spells** (green) — Normal, Quick-Play, Continuous, Equip, Field, Ritual.
- **Traps** (pink) — must be Set before activating (normally); Normal, Continuous, Counter.

## Chains
Effects activate in a **Chain** and resolve in reverse order — like Magic's stack. Spell Speed decides what can respond.
`,
      },
    ],
  },
  {
    slug: 'hearthstone',
    title: 'Hearthstone',
    category: 'card',
    tagline: 'Blizzard\'s fast, digital collectible card game.',
    description:
      'Choose a hero class from the Warcraft universe and build a 30-card deck. Hearthstone features Standard, Wild, Battlegrounds (an auto-battler), Arena drafts and more.',
    aliases: ['HS'],
    genres: ['Digital CCG', 'Strategy'],
    platforms: ['PC', 'Mobile'],
    developer: 'Blizzard Entertainment',
    publisher: 'Blizzard Entertainment',
    release_year: 2014,
    players: '2 (8 in Battlegrounds)',
    play_time: '10–20 min',
    is_continuous: true,
    hue: 35,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Mana crystals, minions and hero powers.',
        content: `
- Each hero starts with **30 Health**. Reduce your opponent to 0 to win.
- You gain one **Mana Crystal** per turn, up to 10, refilled each turn.
- Play **minions**, **spells**, **weapons** and **locations**. Each class has a unique **Hero Power** costing 2 mana.
- Minions can attack the turn after they're played unless they have **Charge** or **Rush**.
- **Taunt** minions must be attacked first.

## Common keywords
| Keyword | Meaning |
|---|---|
| **Battlecry** | Does something when played from hand. |
| **Deathrattle** | Does something when it dies. |
| **Divine Shield** | Ignores the first damage taken. |
| **Lifesteal** | Damage dealt heals your hero. |
| **Discover** | Choose one of three options. |
| **Windfury** | Can attack twice per turn. |
`,
      },
    ],
  },
  {
    slug: 'disney-lorcana',
    title: 'Disney Lorcana',
    category: 'card',
    tagline: 'Quest for lore with Disney characters as Illumineers.',
    description:
      'Players are Illumineers who summon glimmers of Disney characters, sending them on quests to collect 20 lore before their opponent.',
    aliases: ['Lorcana'],
    genres: ['Trading Card Game', 'Family'],
    platforms: ['Tabletop'],
    developer: 'Ravensburger',
    publisher: 'Ravensburger',
    release_year: 2023,
    players: '2+',
    play_time: '20–30 min',
    age: '8+',
    is_continuous: true,
    hue: 225,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Inkwell, questing and challenging.',
        content: `
- Decks are **60 cards** in **one or two ink colors** (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel). Max 4 copies of a card.
- Once per turn, put a card with the **inkwell symbol** face down into your **inkwell** to use as ink (mana).
- **Quest**: exert a character to gain its **lore** value. First to **20 lore** wins.
- **Challenge**: exert a character to fight an exerted opposing character; both deal damage equal to their strength.
- Characters are "drying" the turn they're played and can't quest or challenge yet.
`,
      },
    ],
  },
  {
    slug: 'one-piece-card-game',
    title: 'One Piece Card Game',
    category: 'card',
    tagline: 'Lead your pirate crew with DON!! cards.',
    description:
      'Choose a Leader from the One Piece universe and build a 50-card deck to reduce your opponent\'s Life cards to zero and land the final hit.',
    aliases: ['OPTCG', 'One Piece TCG'],
    genres: ['Trading Card Game', 'Anime'],
    platforms: ['Tabletop'],
    developer: 'Bandai',
    publisher: 'Bandai',
    release_year: 2022,
    players: '2',
    play_time: '20–30 min',
    age: '10+',
    is_continuous: true,
    hue: 5,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Leaders, DON!! and Life.',
        content: `
- Decks are **50 cards** plus a **Leader** and a separate **10-card DON!! deck**. Cards must match your Leader's color.
- Your **Life** equals the number printed on your Leader (usually 4–5 face-down cards).
- Each turn, add **2 DON!!** (1 for the first player's first turn). Rest DON!! to play cards, or attach them for +1000 power.
- When your Leader takes damage, add a Life card to your hand — it may have a **Trigger**.
- Take damage with no Life left and you lose.
`,
      },
    ],
  },
  {
    slug: 'texas-holdem-poker',
    title: "Texas Hold'em Poker",
    category: 'card',
    tagline: 'The world\'s most popular poker variant.',
    description:
      'Each player gets two private cards and shares five community cards. Make the best five-card hand — or bluff your opponents into folding.',
    aliases: ['Poker', 'Holdem', 'Hold em', 'NLHE'],
    genres: ['Classic', 'Casino', 'Bluffing'],
    platforms: ['Tabletop', 'PC', 'Mobile'],
    players: '2–10',
    play_time: 'Varies',
    age: '18+',
    is_continuous: true,
    hue: 140,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Blinds, betting rounds and showdown.',
        content: `
1. **Blinds:** the two players left of the dealer post the small and big blind.
2. **Pre-flop:** everyone gets 2 hole cards. Betting round.
3. **Flop:** 3 community cards. Betting round.
4. **Turn:** 1 more card. Betting round.
5. **River:** final card. Betting round.
6. **Showdown:** best five-card hand from any combination of your 2 and the board's 5 wins.

Betting options: **check, bet, call, raise, fold**.
`,
      },
      {
        slug: 'hand-rankings',
        title: 'Hand Rankings',
        icon: 'Ranking',
        summary: 'From Royal Flush to High Card.',
        content: `
| Rank | Hand | Example |
|---|---|---|
| 1 | **Royal Flush** | A K Q J 10, same suit |
| 2 | **Straight Flush** | 9 8 7 6 5, same suit |
| 3 | **Four of a Kind** | Q Q Q Q 4 |
| 4 | **Full House** | 7 7 7 K K |
| 5 | **Flush** | Any five of one suit |
| 6 | **Straight** | 10 9 8 7 6, mixed suits |
| 7 | **Three of a Kind** | 5 5 5 A 9 |
| 8 | **Two Pair** | J J 3 3 A |
| 9 | **One Pair** | 8 8 K 7 2 |
| 10 | **High Card** | A J 9 6 3 |
`,
      },
    ],
  },
  {
    slug: 'uno',
    steam_appid: 470220,
    title: 'UNO',
    category: 'card',
    tagline: 'Match colors and numbers — and don\'t forget to say UNO!',
    description:
      'The classic family shedding game. Be the first to play all your cards by matching color or number, using action cards to disrupt your opponents.',
    genres: ['Family', 'Party', 'Classic'],
    platforms: ['Tabletop', 'PC', 'Mobile', 'Consoles'],
    publisher: 'Mattel',
    release_year: 1971,
    players: '2–10',
    play_time: '15–30 min',
    age: '7+',
    is_continuous: true,
    hue: 0,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Matching, action cards and calling UNO.',
        content: `
- Deal **7 cards** each. Flip the top card to start the discard pile.
- On your turn, play a card matching the **color, number or symbol**, or draw one.
- **Skip**, **Reverse**, **Draw Two**, **Wild** and **Wild Draw Four** shake things up.
- Say **"UNO!"** when you have one card left — get caught and draw 2.
- Officially, Draw cards **don't stack** (a popular house rule).
`,
      },
    ],
  },
];
