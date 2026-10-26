// Board games are replayed rather than "completed", so most use the ongoing statuses.
// Campaign games with an ending (Gloomhaven, Pandemic Legacy) use the finite set.

export default [
  {
    slug: 'catan',
    steam_appid: 544730,
    title: 'Catan',
    category: 'board',
    tagline: 'Trade, build and settle the island of Catan.',
    description:
      'Players are settlers on the island of Catan, gathering resources from the land to build roads, settlements and cities. Trading and negotiation are at the heart of the game. First to 10 victory points wins.',
    aliases: ['Settlers of Catan'],
    genres: ['Strategy', 'Trading', 'Family'],
    platforms: ['Tabletop', 'PC', 'Mobile'],
    developer: 'Klaus Teuber',
    publisher: 'CATAN GmbH / Catan Studio',
    release_year: 1995,
    players: '3–4',
    play_time: '60–120 min',
    age: '10+',
    is_continuous: true,
    featured: true,
    hue: 25,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Setup, turns, building costs and how to win.',
        content: `
## Setup
Build the hex board, place number tokens, and each player places **two settlements and two roads** (snake draft order). Your second settlement collects starting resources.

## Your turn
1. **Roll** two dice. Every hex with that number produces resources for adjacent settlements (1) and cities (2).
2. **Trade** with other players or the bank (4:1, or better at harbors).
3. **Build** and buy development cards.

## Building costs
| Build | Cost | Points |
|---|---|---|
| **Road** | Brick + Lumber | — |
| **Settlement** | Brick + Lumber + Wool + Grain | 1 |
| **City** (upgrade) | 3 Ore + 2 Grain | 2 |
| **Development card** | Ore + Wool + Grain | varies |

## Rolling a 7
Anyone with more than 7 cards discards half. The roller moves the **robber** to block a hex and steals a card from a player there.

## Bonus points
- **Longest Road** (5+ segments): 2 points.
- **Largest Army** (3+ knights played): 2 points.

First to **10 victory points** on their turn wins.
`,
      },
      {
        slug: 'strategy',
        title: 'Strategy Tips',
        icon: 'Lightbulb',
        summary: 'Opening placement, resource balance and trading tips.',
        content: `
- **6 and 8** are the most-rolled numbers (5/36 each). Favor them in your opening, but diversify.
- **Ore + Grain** fuel cities and development cards — strong for a late game.
- **Brick + Lumber** let you expand quickly early.
- Grab a **harbor** that matches a resource you produce a lot of.
- Don't hoard — trading keeps you moving and avoids losing cards to a 7.
`,
      },
    ],
  },
  {
    slug: 'ticket-to-ride',
    steam_appid: 2477010,
    title: 'Ticket to Ride',
    category: 'board',
    tagline: 'Build train routes across North America.',
    description:
      'Collect train cards to claim railway routes between cities, completing secret destination tickets for bonus points. Simple to learn and endlessly replayable, with many map expansions.',
    genres: ['Family', 'Route Building', 'Set Collection'],
    platforms: ['Tabletop', 'PC', 'Mobile'],
    developer: 'Alan R. Moon',
    publisher: 'Days of Wonder',
    release_year: 2004,
    players: '2–5',
    play_time: '30–60 min',
    age: '8+',
    is_continuous: true,
    hue: 5,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'The three actions and scoring.',
        content: `
On your turn, do **one** of:
1. **Draw train cards** — take two (from the face-up five or the deck). A face-up locomotive (wild) counts as both draws.
2. **Claim a route** — play cards matching the route's color and length. Gray routes take any one color.
3. **Draw destination tickets** — draw three, keep at least one.

## Scoring
| Route length | Points |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 3 | 4 |
| 4 | 7 |
| 5 | 10 |
| 6 | 15 |

Completed tickets add their value; incomplete ones subtract it. The **longest continuous route** gets a 10-point bonus. The game ends when someone has two or fewer trains left — everyone gets one final turn.
`,
      },
    ],
  },
  {
    slug: 'pandemic',
    title: 'Pandemic',
    category: 'board',
    tagline: 'Work together to cure four diseases before they spread.',
    description:
      'A cooperative game where players are disease-fighting specialists racing to discover cures for four deadly diseases while outbreaks spread across the globe. Everyone wins or loses together.',
    genres: ['Cooperative', 'Strategy'],
    platforms: ['Tabletop'],
    developer: 'Matt Leacock',
    publisher: 'Z-Man Games',
    release_year: 2008,
    players: '2–4',
    play_time: '45 min',
    age: '8+',
    is_continuous: true,
    hue: 175,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Actions, infection, epidemics and winning.',
        content: `
## Your turn
1. Take **4 actions**: drive, fly, build a research station, treat disease, share knowledge, or discover a cure.
2. Draw **2 player cards** (watch out for Epidemics).
3. **Infect** cities by drawing infection cards equal to the infection rate.

## Outbreaks
If a city would get a 4th cube of a color, it **outbreaks** — spreading a cube to every connected city.

## Win and loss
- **Win** by discovering all four cures (5 cards of one color at a research station).
- **Lose** if there are 8 outbreaks, you run out of cubes of a color, or the player deck runs out.

## Tips
- Each role has a special power — plan around the **Medic**, **Scientist** and **Researcher**.
- Treat cities with 3 cubes before they outbreak.
`,
      },
    ],
  },
  {
    slug: 'wingspan',
    steam_appid: 1054490,
    title: 'Wingspan',
    category: 'board',
    tagline: 'Attract birds to your wildlife preserves.',
    description:
      'A competitive engine-building game about birds. Play bird cards into forest, grassland and wetland habitats to build powerful combos of food, eggs and cards.',
    genres: ['Engine Building', 'Card Drafting', 'Nature'],
    platforms: ['Tabletop', 'PC', 'Nintendo Switch'],
    developer: 'Elizabeth Hargrave',
    publisher: 'Stonemaier Games',
    release_year: 2019,
    players: '1–5',
    play_time: '40–70 min',
    age: '10+',
    is_continuous: true,
    hue: 160,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Four actions, habitats and end-of-round goals.',
        content: `
The game lasts **4 rounds**, with one fewer action each round. On your turn, choose one:
1. **Play a bird** from your hand (pay food and eggs).
2. **Gain food** (forest row).
3. **Lay eggs** (grassland row).
4. **Draw bird cards** (wetland row).

Each bird you add to a row makes that row's action stronger and may trigger **brown powers** from right to left.

## Scoring
Points for birds, bonus cards, end-of-round goals, eggs, cached food and tucked cards.
`,
      },
    ],
  },
  {
    slug: 'gloomhaven',
    steam_appid: 780290,
    title: 'Gloomhaven',
    category: 'board',
    tagline: 'A tactical campaign of mercenaries and dungeon crawling.',
    description:
      'A legacy-style cooperative campaign of tactical combat in a persistent fantasy world. Mercenaries explore dungeons, make story choices and retire to unlock new classes.',
    aliases: ['Gloomhaven: Jaws of the Lion', 'Frosthaven'],
    genres: ['Dungeon Crawler', 'Cooperative', 'Campaign'],
    platforms: ['Tabletop', 'PC'],
    developer: 'Isaac Childres',
    publisher: 'Cephalofair Games',
    release_year: 2017,
    players: '1–4',
    play_time: '60–120 min',
    age: '14+',
    hue: 250,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Card selection, initiative and exhaustion.',
        content: `
## Each round
1. Every player picks **two ability cards** from their hand.
2. Reveal; the **leading card's initiative** sets turn order.
3. On your turn, use the **top action of one card and the bottom of the other**.

## Exhaustion
Your hand is your stamina. When you can't play two cards (or rest), you're **exhausted**. **Rest** to recover cards, losing one permanently each time.

## Tips
- Plan two rounds ahead and coordinate initiative with allies.
- **Lost** cards (with the X icon) are powerful but gone for the scenario — use them wisely.
`,
      },
    ],
  },
  {
    slug: 'chess',
    title: 'Chess',
    category: 'board',
    tagline: 'The timeless game of strategy.',
    description:
      'Two players command armies of sixteen pieces on an 8×8 board, aiming to checkmate the opposing king. Played for over 1,500 years and enjoyed by millions online every day.',
    genres: ['Abstract Strategy', 'Classic'],
    platforms: ['Tabletop', 'PC', 'Mobile'],
    players: '2',
    play_time: '10–60 min',
    age: '6+',
    is_continuous: true,
    hue: 220,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'How each piece moves and special rules.',
        content: `
| Piece | Moves |
|---|---|
| **King** | One square in any direction. |
| **Queen** | Any number of squares in any direction. |
| **Rook** | Any number of squares horizontally or vertically. |
| **Bishop** | Any number of squares diagonally. |
| **Knight** | An "L": two squares one way and one perpendicular. Jumps over pieces. |
| **Pawn** | Forward one square (two on its first move); captures diagonally. |

## Special moves
- **Castling** — move the king two squares toward a rook, and the rook jumps over. Neither may have moved, and the king can't castle out of, through or into check.
- **En passant** — a pawn that moves two squares can be captured by an enemy pawn as if it moved one.
- **Promotion** — a pawn reaching the far rank becomes any piece (usually a queen).

## Ending the game
- **Checkmate** — the king is attacked and can't escape.
- **Stalemate** — no legal moves and not in check: a draw.
`,
      },
      {
        slug: 'opening-principles',
        title: 'Opening Principles',
        icon: 'Lightbulb',
        summary: 'Center control, development and king safety.',
        content: `
1. **Control the center** with pawns and pieces (e4, d4, e5, d5).
2. **Develop knights and bishops** before moving the queen.
3. **Castle early** to protect your king.
4. Don't move the same piece twice in the opening without a reason.
5. Connect your rooks.
`,
      },
    ],
  },
  {
    slug: 'azul',
    title: 'Azul',
    category: 'board',
    tagline: 'Draft beautiful tiles to decorate the royal palace.',
    description:
      'Players draft colorful tiles from factory displays and arrange them on their boards to score points, while avoiding waste.',
    genres: ['Abstract', 'Tile Placement', 'Family'],
    platforms: ['Tabletop'],
    developer: 'Michael Kiesling',
    publisher: 'Next Move Games',
    release_year: 2017,
    players: '2–4',
    play_time: '30–45 min',
    age: '8+',
    is_continuous: true,
    hue: 205,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Drafting, pattern lines and wall scoring.',
        content: `
1. Take **all tiles of one color** from a factory (the rest go to the center) or from the center.
2. Place them in one **pattern line**. Excess tiles drop to the **floor line** for negative points.
3. At round end, completed lines move one tile to your **wall** and score for adjacent tiles.
4. The game ends when someone completes a horizontal row. Bonus points for full rows, columns and colors.
`,
      },
    ],
  },
  {
    slug: 'codenames',
    steam_appid: 884670,
    title: 'Codenames',
    category: 'board',
    tagline: 'Give one-word clues to find your secret agents.',
    description:
      'Two rival spymasters know the secret identities of 25 agents. Their teammates know them only by codenames. Give clever one-word clues to help your team find their agents — and avoid the assassin.',
    genres: ['Party', 'Word', 'Team'],
    platforms: ['Tabletop'],
    developer: 'Vlaada Chvátil',
    publisher: 'Czech Games Edition',
    release_year: 2015,
    players: '2–8+',
    play_time: '15 min',
    age: '10+',
    is_continuous: true,
    hue: 0,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Clues, guesses and the assassin.',
        content: `
- The spymaster gives **one word and one number**, e.g. "Ocean, 2".
- Teammates guess one card at a time. Correct guesses let you continue (up to the number + 1).
- Guessing a bystander or the other team's agent ends your turn. Guessing the **assassin** loses the game.
- First team to contact all of its agents wins.
`,
      },
    ],
  },
  {
    slug: 'terraforming-mars',
    steam_appid: 800270,
    title: 'Terraforming Mars',
    category: 'board',
    tagline: 'Corporations compete to make Mars habitable.',
    description:
      'Raise the temperature, oxygen and ocean coverage of Mars while building an engine of projects and cities. The player with the most points when Mars is fully terraformed wins.',
    genres: ['Engine Building', 'Strategy', 'Sci-Fi'],
    platforms: ['Tabletop', 'PC'],
    developer: 'Jacob Fryxelius',
    publisher: 'FryxGames / Stronghold Games',
    release_year: 2016,
    players: '1–5',
    play_time: '120 min',
    age: '12+',
    is_continuous: true,
    hue: 15,
    sections: [
      {
        slug: 'how-to-play',
        title: 'How to Play',
        icon: 'BookOpen',
        summary: 'Generations, global parameters and production.',
        content: `
The game is played in **generations**. Each generation: draft/buy project cards, take actions (two per turn) until everyone passes, then collect production.

## Global parameters
- **Temperature** (−30 °C to +8 °C), **Oxygen** (0–14%), **Oceans** (9 tiles).
- Raising any one increases your **Terraform Rating** (TR) — your income and a big part of your score.

## Tips
- Early **production** compounds — invest in it.
- Pick a **corporation** that matches your opening cards.
`,
      },
    ],
  },
];
