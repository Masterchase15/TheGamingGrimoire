// Video game wiki entries. `is_continuous` marks live-service and competitive
// multiplayer games, which use the ongoing status set instead of Completed/Dropped.
// Finite games get completion times from HowLongToBeat (hltb_query overrides the title used).

export default [
  {
    slug: 'elden-ring',
    steam_appid: 1245620,
    title: 'Elden Ring',
    category: 'video',
    tagline: 'An open-world action RPG in the Lands Between from FromSoftware.',
    description:
      'Rise, Tarnished, and be guided by grace to become Elden Lord. Elden Ring blends FromSoftware\'s punishing, precise combat with a vast open world, letting you explore at your own pace, tackle bosses in any order, and build your character however you like. Its Shadow of the Erdtree expansion adds an entire new region.',
    aliases: ['ER', 'Shadow of the Erdtree'],
    genres: ['Action RPG', 'Soulslike', 'Open World'],
    platforms: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch 2'],
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    release_year: 2022,
    featured: true,
    hue: 42,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Your first hours in Limgrave: what to do, where to go, and what to avoid.',
        content: `
## Choosing a class
Your starting class only sets your initial stats — you can build into anything later. Good beginner picks:
- **Vagabond** — high Vigor, a sword, shield and heavy armor. Very forgiving.
- **Samurai** — the Uchigatana (with bleed) and a longbow. Excellent early damage.
- **Astrologer** — a ranged sorcery build that lets you fight from a distance.

## Your first steps
1. After the tutorial, rest at the **Church of Elleh** and meet the merchant Kalé — buy the **Crafting Kit** and **Torch**.
2. Rest at three Sites of Grace and **Melina** will give you **Torrent**, your spirit steed.
3. Find the **Spirit Calling Bell** at the Roundtable Hold or from Ranni at Church of Elleh at night — summon spirit ashes to help in boss fights.
4. Head to **Gatefront Ruins** for the map fragment of Limgrave, and grab the **Flail** and the Ash of War: Lion's Claw.

## Key tips
- **Level Vigor.** Aim for 40 Vigor by mid-game; one-shots are the top cause of frustration.
- If a boss feels impossible, **explore elsewhere and come back stronger.** The open world is designed for this.
- **Upgrade your weapon** with Smithing Stones — it matters more than leveling damage stats.
- Use **Golden Seeds** to add Flask of Crimson Tears charges and **Sacred Tears** to strengthen them.
- **Margit, the Fell Omen** is a skill check. Use the Margit's Shackle item (sold by Patches/Kalé) to stun him.
`,
      },
      {
        slug: 'stats-and-builds',
        title: 'Stats & Builds',
        icon: 'Sword',
        summary: 'What every attribute does and popular build archetypes.',
        content: `
## Attributes
| Stat | What it does |
|---|---|
| **Vigor** | Max HP and fire defense. The most important stat. |
| **Mind** | Max FP (focus points) for spells and Ashes of War. |
| **Endurance** | Stamina and equip load. |
| **Strength** | Heavy weapon requirements and scaling. |
| **Dexterity** | Fast weapon requirements and scaling; shortens casting time. |
| **Intelligence** | Sorcery scaling and magic defense. |
| **Faith** | Incantation scaling. |
| **Arcane** | Item discovery, bleed/poison buildup and certain incantations. |

## Soft caps
Most damage stats see diminishing returns after **55**, and further after **80**. Vigor scales well up to **60**.

## Popular builds
- **Strength / Colossal weapons** — slow, devastating hits that stagger bosses.
- **Dexterity / Bleed** — fast katanas and Arcane bleed procs.
- **Pure Intelligence** — sorceries like Rock Sling, Comet Azur.
- **Faith** — incantations, buffs and holy or lightning damage.
- **Quality** — balanced Strength and Dexterity for flexible weapon choice.

## Respec
After defeating Rennala, you can use **Larval Tears** to reallocate your stats at the Raya Lucaria Academy.
`,
      },
    ],
  },
  {
    slug: 'baldurs-gate-3',
    steam_appid: 1086940,
    title: "Baldur's Gate 3",
    category: 'video',
    tagline: 'A party-based RPG set in the world of Dungeons & Dragons.',
    description:
      "Gather your party and return to the Forgotten Realms. Baldur's Gate 3 is a story-rich, turn-based RPG built on D&D 5th Edition rules, where every choice — in conversation and in combat — can reshape the story. Play solo or in co-op with up to four players.",
    aliases: ['BG3', 'Baldurs Gate 3'],
    genres: ['CRPG', 'Turn-Based', 'Fantasy'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'macOS'],
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    release_year: 2023,
    featured: true,
    hue: 0,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Character creation, party building and the core turn-based rules.',
        content: `
## Character creation
- **Origin characters** (Astarion, Shadowheart, Gale, Lae'zel, Wyll, Karlach, The Dark Urge) come with personal stories. A **custom character** gives you a blank slate.
- Classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock and Wizard. Each picks a **subclass** between levels 1 and 3.
- Put your highest score in your class's main stat (Strength/Dexterity for martials, Intelligence/Wisdom/Charisma for casters) and keep **Constitution** healthy.

## Turn structure
Every turn you get:
- **Movement** (based on speed)
- One **Action** (attack, cast a spell, Dash, Help…)
- One **Bonus Action** (off-hand attack, Shove, jump, drinking a potion…)
- One **Reaction** (attacks of opportunity, Counterspell, Shield)

## Tips
- **High ground** gives a bonus to hit; **Shove** enemies off ledges for instant kills.
- **Long rest** at camp often — many story scenes only trigger there.
- **Save often** and in multiple slots; the game is famously reactive.
- Use **Help** (action) to pick up downed allies, and keep scrolls of Revivify handy.
- Talk to animals with *Speak with Animals*, and to corpses with *Speak with Dead* — both unlock unique content.
`,
      },
      {
        slug: 'classes',
        title: 'Classes at a Glance',
        icon: 'UsersThree',
        summary: 'What each of the 12 classes does best.',
        content: `
| Class | Role | Highlights |
|---|---|---|
| **Barbarian** | Tank / melee damage | Rage for damage resistance and bonus damage. |
| **Bard** | Support / face | Bardic Inspiration, best social skills, spells from every list (Lore). |
| **Cleric** | Healer / support | Domain choice defines playstyle; great buffs like Bless. |
| **Druid** | Shapeshifter / control | Wild Shape forms and nature magic. |
| **Fighter** | Melee or ranged | Action Surge, Extra Attack, consistent damage. |
| **Monk** | Mobile striker | Ki points, Flurry of Blows, stuns. |
| **Paladin** | Tank / burst | Divine Smite, auras, Oaths. |
| **Ranger** | Ranged / scout | Favored enemies, animal companion (Beast Master). |
| **Rogue** | Skill / burst | Sneak Attack, extra bonus actions (Thief). |
| **Sorcerer** | Blaster | Metamagic: Twinned, Quickened spells. |
| **Warlock** | Ranged caster | Eldritch Blast, short-rest spell slots. |
| **Wizard** | Versatile caster | Learn spells from scrolls; the largest spell list. |
`,
      },
    ],
  },
  {
    slug: 'the-witcher-3',
    steam_appid: 292030,
    title: 'The Witcher 3: Wild Hunt',
    category: 'video',
    tagline: 'Monster-hunting open-world RPG starring Geralt of Rivia.',
    description:
      'Play as Geralt of Rivia, a professional monster slayer searching for his adopted daughter Ciri while the spectral Wild Hunt closes in. Known for its rich side quests, morally gray choices, and two acclaimed expansions: Hearts of Stone and Blood and Wine.',
    aliases: ['Witcher 3', 'TW3', 'Wild Hunt'],
    genres: ['Action RPG', 'Open World', 'Fantasy'],
    platforms: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch'],
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    release_year: 2015,
    hue: 200,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Signs, oils, Gwent and the habits that make the game click.',
        content: `
## Combat basics
- **Steel sword for humans, silver sword for monsters.**
- **Signs** are Geralt's magic: *Igni* (fire), *Quen* (shield), *Aard* (force push), *Yrden* (trap), *Axii* (mind control). **Quen** is the best defensive tool for new players.
- Read the **Bestiary** before contracts — it tells you each monster's weaknesses (oils, bombs, signs).
- **Meditate** to restore potions and decoctions (if you have alcohol).

## Leveling
- Witcher contracts and side quests give huge XP — don't rush the main story.
- Quests turn gray when you out-level them and give little XP, so do them on time.
- Invest in one skill tree (Combat, Signs or Alchemy) and slot abilities in the mutagen-linked slots for bonuses.

## Tips
- Play **Gwent**, the in-world card game — it's surprisingly deep and rewards unique cards.
- Check **notice boards** in every village.
- Your choices in the *Bloody Baron* questline and with Ciri shape the ending.
`,
      },
    ],
  },
  {
    slug: 'hollow-knight',
    steam_appid: 367520,
    title: 'Hollow Knight',
    category: 'video',
    tagline: 'A hand-drawn Metroidvania through the fallen bug kingdom of Hallownest.',
    description:
      'Descend into Hallownest, a ruined kingdom of insects, and uncover its ancient secrets. Hollow Knight is a challenging 2D action-adventure with tight combat, a huge interconnected world, and haunting atmosphere.',
    aliases: ['HK'],
    genres: ['Metroidvania', 'Action', 'Platformer'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    release_year: 2017,
    hue: 215,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Maps, charms, Geo and how to survive the early game.',
        content: `
## Getting around
- Find **Cornifer** (listen for humming) to buy area maps, and buy a **Quill** from Iselda in Dirtmouth so your map updates.
- Rest at **benches** to save, heal and change charms.
- When you die, your **Shade** keeps your Geo where you fell. Defeat it to get it back.

## Charms
Charms are equippable perks limited by **notches**. Great early charms:
- **Wayward Compass** — shows your location on the map.
- **Gathering Swarm** — collects dropped Geo.
- **Soul Catcher** and **Quick Focus** — better healing.
- **Unbreakable Strength** — big damage boost (buy and keep it safe!).

## Tips
- Upgrade your **Nail** at the Nailsmith in the City of Tears as soon as you can afford it.
- **Pogo** (down-strike) off enemies and spikes to reach new heights.
- Abilities like **Mantis Claw** (wall jump) and **Mothwing Cloak** (dash) open up the map — explore when you get them.
`,
      },
    ],
  },
  {
    slug: 'hollow-knight-silksong',
    steam_appid: 1030300,
    title: 'Hollow Knight: Silksong',
    category: 'video',
    tagline: 'Play as Hornet in the long-awaited sequel to Hollow Knight.',
    description:
      'Captured and taken to the haunted kingdom of Pharloom, Hornet — princess-protector of Hallownest — must climb to its shining citadel. Silksong brings faster, acrobatic combat, crafted tools, and a new kingdom full of quests.',
    aliases: ['Silksong'],
    genres: ['Metroidvania', 'Action', 'Platformer'],
    platforms: ['PC', 'Nintendo Switch', 'Nintendo Switch 2', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One'],
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    release_year: 2025,
    featured: true,
    hue: 350,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Silk, tools, crests and getting through the opening areas.',
        content: `
## What's different from Hollow Knight
- **Silk** powers healing (Bind) and Silk Skills. Hitting enemies fills your silk spool.
- Binding heals **multiple masks at once**, but you have to commit to it — pick your moment.
- **Tools** (thrown weapons, traps and gadgets) are crafted and restocked using **shell shards**.
- **Crests** change Hornet's moveset and the slots available for tools.

## Tips
- Rosaries are your currency — string them into **rosary strings** to keep them safe from death.
- Take on **wishes** (quests) from the bulletin boards in towns for rewards.
- Explore for **mask shards** and **spool fragments** early to boost your survivability.
- If a boss is too hard, look for another path — like Hollow Knight, Pharloom is very open.
`,
      },
    ],
  },
  {
    slug: 'zelda-tears-of-the-kingdom',
    title: 'The Legend of Zelda: Tears of the Kingdom',
    category: 'video',
    tagline: "Link explores the skies, surface and depths of Hyrule.",
    description:
      'The sequel to Breath of the Wild expands Hyrule upward into floating sky islands and downward into the vast Depths. New abilities like Ultrahand and Fuse let you build vehicles, craft weapons and solve problems your own way.',
    aliases: ['TOTK', 'Zelda', 'Tears of the Kingdom'],
    genres: ['Action Adventure', 'Open World'],
    platforms: ['Nintendo Switch', 'Nintendo Switch 2'],
    developer: 'Nintendo EPD',
    publisher: 'Nintendo',
    release_year: 2023,
    hltb_query: 'The Legend of Zelda: Tears of the Kingdom',
    hue: 140,
    sections: [
      {
        slug: 'abilities',
        title: "Link's Abilities",
        icon: 'MagicWand',
        summary: 'Ultrahand, Fuse, Ascend, Recall and Autobuild explained.',
        content: `
| Ability | What it does |
|---|---|
| **Ultrahand** | Pick up, rotate and glue objects together to build vehicles and contraptions. |
| **Fuse** | Attach materials to weapons, shields and arrows for new effects. |
| **Ascend** | Swim up through ceilings to reach the surface above. |
| **Recall** | Rewind an object's movement through time. |
| **Autobuild** | Rebuild saved or schematic designs instantly (costs zonaite if parts are missing). |

## Tips
- **Fuse monster horns** to weapons for big damage boosts.
- Light up the Depths by activating **Lightroots** — they mirror Shrine locations above.
- Activate **Skyview Towers** to reveal the map.
- Trade **Lights of Blessing** at Goddess Statues for more hearts or stamina.
`,
      },
    ],
  },
  {
    slug: 'red-dead-redemption-2',
    steam_appid: 1174180,
    title: 'Red Dead Redemption 2',
    category: 'video',
    tagline: "Arthur Morgan's story of loyalty and the end of the outlaw era.",
    description:
      'America, 1899. Arthur Morgan and the Van der Linde gang are on the run after a robbery goes wrong. Red Dead Redemption 2 is a sprawling, deeply detailed open-world western about the decline of the outlaw life.',
    aliases: ['RDR2', 'Red Dead 2'],
    genres: ['Action Adventure', 'Open World', 'Western'],
    platforms: ['PC', 'PlayStation 4', 'Xbox One'],
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    release_year: 2018,
    hue: 15,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Cores, honor, horses and camp.',
        content: `
## Cores and attributes
Arthur and his horse each have **Health, Stamina and Dead Eye** — a core (inner ring) and a bar. Cores drain over time; eat, sleep and use tonics to refill them.

## Honor
Your actions affect your **Honor**. High honor means shop discounts and different story moments; low honor changes dialogue and outcomes.

## Tips
- **Bond with your horse** by brushing, feeding and patting it.
- Donate to the **camp ledger** and upgrade it to unlock fast travel.
- Hunt for **perfect pelts** for crafting satchels at the trapper.
- Play the epilogue — it's a substantial part of the story.
`,
      },
    ],
  },
  {
    slug: 'hades',
    steam_appid: 1145360,
    patch_exclude: 'Hades II',
    title: 'Hades',
    category: 'video',
    tagline: 'Battle out of the Underworld in this god-like roguelike.',
    description:
      'As Zagreus, the immortal son of Hades, you fight your way out of the Underworld with the help of the Olympian gods. Every escape attempt is different, and every death moves the story forward.',
    genres: ['Roguelike', 'Action'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One'],
    developer: 'Supergiant Games',
    publisher: 'Supergiant Games',
    release_year: 2020,
    hue: 330,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Boons, weapons, the Mirror of Night and God Mode.',
        content: `
## The loop
Each run takes you through **Tartarus, Asphodel, Elysium and the Temple of Styx**. Dying sends you back to the House of Hades, where you spend currencies on permanent upgrades.

## Currencies
- **Darkness** — upgrades at the **Mirror of Night** (get *Death Defiance* first).
- **Chthonic Keys** — unlock weapons and mirror talents.
- **Gemstones** — house decorations and useful renovations.
- **Nectar** — gift to characters for Keepsakes.
- **Titan Blood** — upgrade weapon aspects.

## Tips
- Turn on **God Mode** if you want the story without the frustration — it adds growing damage resistance.
- Equip **Keepsakes** that guarantee a god's boons to build a strategy.
- Prioritize boons on your **Attack** and **Special**, then **Dash**.
`,
      },
    ],
  },
  {
    slug: 'clair-obscur-expedition-33',
    steam_appid: 1903340,
    title: 'Clair Obscur: Expedition 33',
    category: 'video',
    tagline: 'A reactive turn-based RPG inspired by Belle Époque France.',
    description:
      'Once a year, the Paintress wakes and paints a number on her monolith — and everyone of that age turns to smoke. Expedition 33 sets out on a desperate mission to destroy her. Turn-based combat meets real-time dodges, parries and aimed shots.',
    aliases: ['Expedition 33', 'E33'],
    genres: ['RPG', 'Turn-Based'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    developer: 'Sandfall Interactive',
    publisher: 'Kepler Interactive',
    release_year: 2025,
    featured: true,
    hue: 45,
    sections: [
      {
        slug: 'combat-guide',
        title: 'Combat Guide',
        icon: 'Sword',
        summary: 'Dodges, parries, AP and Pictos.',
        content: `
## Reactive turn-based combat
- On your turn, choose **attacks, skills or Free Aim shots**. Skills cost **AP**.
- On enemy turns, **Dodge** (wide timing window) or **Parry** (tight window). Parrying restores AP and, if you parry every hit, triggers a counterattack.
- **Gradient attacks** need a special jump or gradient counter.

## Pictos and Luminas
- **Pictos** grant stats and passive effects. Win four battles with a Picto equipped to master it as a **Lumina**.
- Luminas can be equipped on any character using Lumina points — the core of build-crafting.

## Tips
- Practice parry timing — it is the single biggest power boost.
- Shoot weak points with **Free Aim** to break enemy shields.
`,
      },
    ],
  },
  {
    slug: 'cyberpunk-2077',
    steam_appid: 1091500,
    title: 'Cyberpunk 2077',
    category: 'video',
    tagline: 'An open-world RPG in the neon megacity of Night City.',
    description:
      'Become V, a mercenary chasing a one-of-a-kind implant that holds the key to immortality — and the digital ghost of rockerboy Johnny Silverhand. Version 2.0 and the Phantom Liberty expansion overhauled the skills, cyberware and police systems.',
    aliases: ['CP2077', 'Phantom Liberty'],
    genres: ['Action RPG', 'Open World', 'Sci-Fi'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch 2'],
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    release_year: 2020,
    hue: 55,
    sections: [
      {
        slug: 'builds',
        title: 'Attributes & Builds',
        icon: 'Cpu',
        summary: 'The five attributes and the builds they enable.',
        content: `
| Attribute | Focus |
|---|---|
| **Body** | Health, shotguns, LMGs, melee bruiser. |
| **Reflexes** | Rifles, SMGs, blades, dashing. |
| **Technical Ability** | Tech weapons, cyberware capacity, health items. |
| **Intelligence** | Quickhacks and smart weapons (netrunner). |
| **Cool** | Stealth, pistols, revolvers, precision rifles, throwing knives. |

## Popular builds
- **Netrunner** — Intelligence + quickhacks; shut down enemies from behind cover.
- **Blade runner** — Reflexes + katanas with the Sandevistan.
- **Gunslinger** — Cool + revolvers for headshots.
- **Tank** — Body + shotguns and the Berserk operating system.
`,
      },
    ],
  },
  {
    slug: 'stardew-valley',
    steam_appid: 413150,
    title: 'Stardew Valley',
    category: 'video',
    tagline: 'Build a life on your grandfather\'s old farm in Pelican Town.',
    description:
      'Leave the city behind to restore an overgrown farm. Grow crops, raise animals, fish, mine, befriend (and marry) townsfolk, and restore the Community Center. Play solo or co-op with up to eight players.',
    genres: ['Farming Sim', 'Life Sim', 'Cozy'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One', 'Mobile'],
    developer: 'ConcernedApe',
    publisher: 'ConcernedApe',
    release_year: 2016,
    hue: 95,
    sections: [
      {
        slug: 'first-year',
        title: 'First Year Guide',
        icon: 'Plant',
        summary: 'What to plant each season and how to make money fast.',
        content: `
## Spring
- Plant **parsnips** early, then **potatoes** and **cauliflower**. Buy **strawberry seeds** at the Egg Festival (Spring 13) and plant them immediately.
- Clear space, fish when it rains, and complete the **Spring Crops Bundle**.

## Summer
- **Blueberries** are the money crop — they regrow every few days. **Melons** and **hops** (for pale ale) are also great.
- Get **Quality Sprinklers** (Farming level 6) to save energy.

## Fall
- **Cranberries** regrow for huge profits; **pumpkins** are great for bundles and gifts.
- Craft **Preserves Jars** and **Kegs** to turn crops into artisan goods.

## Winter
- Mine, fish, forage winter roots and build relationships.
- Plan your farm layout for next year.

## Tips
- Watch the **TV** for luck and recipes.
- Talk to villagers and give gifts twice a week — loved gifts on birthdays count for 8×.
`,
      },
    ],
  },
  {
    slug: 'god-of-war-ragnarok',
    steam_appid: 2322010,
    title: 'God of War Ragnarök',
    category: 'video',
    tagline: 'Kratos and Atreus face the end of the Norse realms.',
    description:
      'Fimbulwinter is ending and Ragnarök approaches. Kratos and Atreus journey through all Nine Realms in search of answers as Asgard prepares for war.',
    aliases: ['GoW Ragnarok', 'God of War Ragnarok'],
    genres: ['Action Adventure'],
    platforms: ['PlayStation 5', 'PlayStation 4', 'PC'],
    developer: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    release_year: 2022,
    hltb_query: 'God of War Ragnarok',
    hue: 190,
    sections: [
      {
        slug: 'combat-tips',
        title: 'Combat Tips',
        icon: 'Sword',
        summary: 'Weapons, shields, and how to deal with tough enemies.',
        content: `
- **Leviathan Axe** for frost and ranged throws, **Blades of Chaos** for fire and crowd control, plus a third weapon later.
- Choose a shield that fits your style: **Dauntless** rewards parries, **Stone Wall** rewards blocking.
- Watch the **ring colors**: yellow can be parried, red must be dodged, blue needs a shield bash.
- Upgrade **Spartan Rage** and use it to heal or escape when overwhelmed.
- Explore the realms after the story for **Berserker** graves and optional bosses.
`,
      },
    ],
  },
  {
    slug: 'celeste',
    steam_appid: 504230,
    title: 'Celeste',
    category: 'video',
    tagline: 'A precision platformer about climbing a mountain and facing anxiety.',
    description:
      'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain. Tight controls, hundreds of handcrafted screens, and a heartfelt story, with an Assist Mode to make it accessible to everyone.',
    genres: ['Platformer', 'Indie'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
    developer: 'Maddy Makes Games',
    publisher: 'Maddy Makes Games',
    release_year: 2018,
    hue: 300,
    sections: [
      {
        slug: 'movement-tech',
        title: 'Movement Tech',
        icon: 'PersonSimpleRun',
        summary: 'Dashes, wavedashes, hypers and climbing.',
        content: `
- **Dash** in eight directions; touching the ground refills it.
- **Climb** walls, but watch your stamina (Madeline flashes red when low).
- **Super dash**: dash horizontally and jump just as you touch the ground for extra distance.
- **Hyper dash**: dash diagonally down into the ground and jump for a long, low leap.
- **Wavedash**: a hyper performed from the air that lets you keep your dash.
- Strawberries are optional — they don't change the ending, just your bragging rights.
`,
      },
    ],
  },

  // ---- Live-service & competitive multiplayer (ongoing statuses) ----
  {
    slug: 'destiny-2',
    steam_appid: 1085660,
    title: 'Destiny 2',
    category: 'video',
    tagline: 'A free-to-play sci-fi looter shooter with raids, PvP and seasonal content.',
    description:
      'Become a Guardian wielding the power of the Light (and Darkness) to protect humanity. Destiny 2 blends tight first-person shooting with MMO-style loot, raids, dungeons and the Crucible PvP mode, updated continuously with expansions and seasons.',
    aliases: ['D2', 'Destiny'],
    genres: ['Looter Shooter', 'FPS', 'MMO'],
    platforms: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One'],
    developer: 'Bungie',
    publisher: 'Bungie',
    release_year: 2017,
    is_continuous: true,
    featured: true,
    hue: 210,
    sections: [
      {
        slug: 'new-player-guide',
        title: 'New Player Guide',
        icon: 'Compass',
        summary: 'Classes, subclasses, power level and where to start.',
        content: `
## Classes
- **Titan** — tough frontliners with barricades.
- **Hunter** — agile with dodges and precision.
- **Warlock** — space wizards with healing rifts.

## Subclasses
Each class can use **Solar, Arc, Void, Stasis, Strand and Prismatic** subclasses. Customize them with **Aspects** and **Fragments** to create builds.

## Getting started
- Follow the **New Light** quest, then the main campaign questlines in the Director.
- Check the **Portal** for activities matched to your gear level.
- Join a **clan** for raid and dungeon groups — raids are the best content in the game.

## Weapons and armor
- Weapons slot into **Kinetic, Energy and Power**.
- **Exotics** are unique gear pieces — you can equip one exotic weapon and one exotic armor at a time.
- Use **mods** on armor to support your build.
`,
      },
      {
        slug: 'activities',
        title: 'Activities',
        icon: 'Planet',
        summary: 'Strikes, Crucible, Gambit, dungeons and raids.',
        content: `
| Activity | Players | Description |
|---|---|---|
| **Vanguard Ops / Strikes** | 3 | Cooperative missions ending in a boss. |
| **Crucible** | 6v6 / 3v3 | PvP: Control, Clash, Trials of Osiris, Iron Banner. |
| **Gambit** | 4v4 | PvE race with invasions. |
| **Dungeons** | 3 | Hard, puzzle-heavy content with great loot. |
| **Raids** | 6 | Destiny's flagship endgame with complex mechanics. |
`,
      },
    ],
  },
  {
    slug: 'helldivers-2',
    steam_appid: 553850,
    title: 'Helldivers 2',
    category: 'video',
    tagline: 'Spread managed democracy in a co-op galactic war.',
    description:
      'Join the Helldivers and fight for freedom across a hostile galaxy in this four-player co-op third-person shooter. Call in stratagems, accidentally blow up your squadmates, and contribute to a community-wide Galactic War that evolves daily.',
    aliases: ['HD2', 'Helldivers'],
    genres: ['Co-op Shooter', 'Third-Person Shooter'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    developer: 'Arrowhead Game Studios',
    publisher: 'Sony Interactive Entertainment',
    release_year: 2024,
    is_continuous: true,
    featured: true,
    hue: 50,
    sections: [
      {
        slug: 'new-recruit-guide',
        title: 'New Recruit Guide',
        icon: 'Compass',
        summary: 'Stratagems, Warbonds, difficulty and teamwork basics.',
        content: `
## Stratagems
Stratagems are called in with directional inputs. Categories include **support weapons** (Autocannon, Recoilless Rifle, Quasar Cannon), **backpacks**, **orbital** and **Eagle** strikes, **sentries** and **vehicles/mechs**.

## Friendly fire is always on
Watch your aim and your airstrikes. Reinforce teammates with the **Reinforce** stratagem.

## Enemies
- **Terminids** — swarming bugs; bring fire and crowd control.
- **Automatons** — ranged robots; bring armor-penetrating weapons and use cover.
- **Illuminate** — a squid-like faction with shields and overseers.

## Progression
- **Requisition** buys stratagems; **Medals** unlock **Warbond** items; **Samples** upgrade your ship.
- Raise difficulty gradually; **Super samples** only appear on higher difficulties.

## Tips
- Destroy **bug holes** and **fabricators** with grenades or explosives to stop endless spawns.
- Stick together, and communicate before calling in big strikes.
`,
      },
    ],
  },
  {
    slug: 'counter-strike-2',
    steam_appid: 730,
    title: 'Counter-Strike 2',
    category: 'video',
    tagline: 'The definitive tactical 5v5 shooter.',
    description:
      'Terrorists and Counter-Terrorists battle over bomb sites in the legendary tactical shooter, rebuilt on the Source 2 engine with volumetric smokes, sub-tick servers and the Premier competitive mode.',
    aliases: ['CS2', 'CS:GO', 'CSGO', 'Counter Strike'],
    genres: ['Tactical FPS', 'Competitive', 'Esports'],
    platforms: ['PC'],
    developer: 'Valve',
    publisher: 'Valve',
    release_year: 2023,
    is_continuous: true,
    hue: 30,
    sections: [
      {
        slug: 'fundamentals',
        title: 'Fundamentals',
        icon: 'Crosshair',
        summary: 'Economy, crosshair placement, utility and rank modes.',
        content: `
## The economy
- You earn money for kills, round wins and losses (loss bonus increases with consecutive losses).
- **Full buy** rifles and utility, **force buy** when you need a round, or **eco** to save for the next round.
- Buy as a team — mixed buys usually lose.

## Aim fundamentals
- **Crosshair placement:** keep your crosshair at head height where enemies will appear.
- **Counter-strafe:** tap the opposite movement key to stop instantly before shooting.
- **Spray control:** learn the first 10 bullets of the AK-47 and M4 patterns.

## Utility
- **Smokes** block vision, **flashbangs** blind, **HE grenades** deal damage, **molotovs/incendiaries** deny areas.
- Learn a few lineups per map from the community.

## Competitive modes
- **Premier** — CS Rating, pick/ban map veto.
- **Competitive** — per-map skill groups.
- **Wingman** — 2v2 on smaller maps.
`,
      },
    ],
  },
  {
    slug: 'call-of-duty-warzone',
    steam_appid: 1938090, // Call of Duty HQ hosts Warzone
    title: 'Call of Duty: Warzone',
    category: 'video',
    tagline: 'Free-to-play battle royale from the Call of Duty franchise.',
    description:
      'Drop in with your squad, loot weapons and cash, and fight to be the last team standing. Warzone integrates weapons and operators from each year\'s premium Call of Duty, with Battle Royale and Resurgence modes.',
    aliases: ['Warzone', 'COD', 'Call of Duty', 'CoD Warzone'],
    genres: ['Battle Royale', 'FPS'],
    platforms: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One'],
    developer: 'Infinity Ward / Raven Software',
    publisher: 'Activision',
    release_year: 2020,
    is_continuous: true,
    hue: 120,
    sections: [
      {
        slug: 'battle-royale-basics',
        title: 'Battle Royale Basics',
        icon: 'Parachute',
        summary: 'Loadouts, the Gulag, buy stations and circles.',
        content: `
- **Loadout drops** let you bring your custom class into a match — buy one at a **Buy Station** once you have enough cash.
- Die early? Win your fight in the **Gulag** to redeploy.
- **Resurgence** modes let squads respawn as long as one teammate is alive.
- Rotate early with the **gas circle**; fighting from the edge exposes your back.
- Buy **UAVs** to spot enemies, and **self-revive kits** for clutch situations.
`,
      },
    ],
  },
  {
    slug: 'battlefield-6',
    steam_appid: 2807960,
    title: 'Battlefield 6',
    category: 'video',
    tagline: 'All-out warfare with destruction, vehicles and squad play.',
    description:
      'Battlefield returns to modern warfare with large-scale combined-arms battles, tactical destruction, a four-class squad system, and community-made modes through Portal.',
    aliases: ['BF6', 'Battlefield'],
    genres: ['FPS', 'Multiplayer', 'Military'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    developer: 'Battlefield Studios',
    publisher: 'Electronic Arts',
    release_year: 2025,
    is_continuous: true,
    hue: 25,
    sections: [
      {
        slug: 'classes',
        title: 'Classes & Squad Play',
        icon: 'UsersThree',
        summary: 'Assault, Engineer, Support and Recon roles.',
        content: `
| Class | Role |
|---|---|
| **Assault** | Frontline fighter with offensive gadgets. |
| **Engineer** | Repairs vehicles and destroys enemy armor. |
| **Support** | Heals, revives and resupplies. |
| **Recon** | Spots enemies, snipes and deploys spawn beacons. |

## Tips
- Play the objective — capturing and holding flags wins Conquest, not kills.
- Use **destruction**: blow open walls for new angles.
- Stay near your squad so they can spawn on you and revive you.
`,
      },
    ],
  },
  {
    slug: 'fortnite',
    title: 'Fortnite',
    category: 'video',
    tagline: 'The free-to-play battle royale with building, zero build and endless modes.',
    description:
      'Drop onto an ever-changing island with 99 others and be the last one standing. Fortnite offers Battle Royale (with or without building), LEGO Fortnite, Fortnite Festival, Rocket Racing and thousands of creator-made islands.',
    aliases: ['FN'],
    genres: ['Battle Royale', 'Third-Person Shooter'],
    platforms: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch', 'Mobile'],
    developer: 'Epic Games',
    publisher: 'Epic Games',
    release_year: 2017,
    is_continuous: true,
    hue: 275,
    sections: [
      {
        slug: 'beginners-guide',
        title: "Beginner's Guide",
        icon: 'Compass',
        summary: 'Dropping, looting, rarity and the storm.',
        content: `
- Weapon rarity: **Common (gray) → Uncommon (green) → Rare (blue) → Epic (purple) → Legendary (gold) → Mythic**.
- Land away from the battle bus path to loot safely in your first games.
- Start with **Zero Build** if building feels overwhelming.
- Always carry **healing** and **shields** — shields absorb damage before health.
- Move with the **storm circle** and use **mobility items** to rotate.
`,
      },
    ],
  },
  {
    slug: 'valorant',
    title: 'Valorant',
    category: 'video',
    tagline: 'Riot\'s 5v5 character-based tactical shooter.',
    description:
      'Precise gunplay meets unique agent abilities. Attack or defend bomb sites (spike sites) across 13 rounds per half in this free-to-play competitive shooter.',
    aliases: ['Valo'],
    genres: ['Tactical FPS', 'Hero Shooter', 'Esports'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    developer: 'Riot Games',
    publisher: 'Riot Games',
    release_year: 2020,
    is_continuous: true,
    hue: 355,
    sections: [
      {
        slug: 'agent-roles',
        title: 'Agent Roles',
        icon: 'UsersThree',
        summary: 'Duelists, Initiators, Controllers and Sentinels.',
        content: `
| Role | Job | Examples |
|---|---|---|
| **Duelist** | Entry fragger, takes first fights | Jett, Reyna, Raze, Phoenix |
| **Initiator** | Gathers info and sets up entries | Sova, Skye, Fade, KAY/O |
| **Controller** | Smokes and blocks vision | Omen, Brimstone, Viper, Astra |
| **Sentinel** | Holds sites and watches flanks | Killjoy, Cypher, Sage, Chamber |

A balanced team usually runs at least one controller and one initiator.
`,
      },
    ],
  },
  {
    slug: 'league-of-legends',
    title: 'League of Legends',
    category: 'video',
    tagline: 'The world\'s most-played MOBA.',
    description:
      'Two teams of five champions battle across Summoner\'s Rift to destroy the enemy Nexus. With over 160 champions, League of Legends is one of the biggest esports in the world.',
    aliases: ['LoL', 'League'],
    genres: ['MOBA', 'Strategy', 'Esports'],
    platforms: ['PC'],
    developer: 'Riot Games',
    publisher: 'Riot Games',
    release_year: 2009,
    is_continuous: true,
    hue: 195,
    sections: [
      {
        slug: 'roles',
        title: 'Roles & Lanes',
        icon: 'MapTrifold',
        summary: 'Top, Jungle, Mid, Bot and Support.',
        content: `
| Role | Job |
|---|---|
| **Top** | Durable fighters and tanks in an isolated lane. |
| **Jungle** | Clears camps, ganks lanes, secures Dragons and Baron. |
| **Mid** | Mages and assassins with high damage and roaming. |
| **Bot (ADC)** | Ranged carries who scale into late-game damage. |
| **Support** | Protects the ADC, provides vision and engages fights. |

## Tips
- **Last-hit minions** for gold (CS).
- Buy **Control Wards** and place vision around objectives.
- Ping and track the enemy jungler.
`,
      },
    ],
  },
  {
    slug: 'minecraft',
    title: 'Minecraft',
    category: 'video',
    tagline: 'Mine, craft and build anything in an infinite blocky world.',
    description:
      'Explore procedurally generated worlds, gather resources, craft tools, build anything you can imagine, and survive the night. Play Survival, Creative, Hardcore, or join multiplayer servers.',
    aliases: ['MC'],
    genres: ['Sandbox', 'Survival', 'Building'],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
    developer: 'Mojang Studios',
    publisher: 'Xbox Game Studios',
    release_year: 2011,
    is_continuous: true,
    hue: 110,
    sections: [
      {
        slug: 'first-night',
        title: 'Surviving the First Night',
        icon: 'Moon',
        summary: 'Wood, tools, shelter and food.',
        content: `
1. Punch trees for **logs**, craft **planks** and a **crafting table**.
2. Make a **wooden pickaxe**, then mine stone for **stone tools**.
3. Find **coal** for **torches**.
4. Build a simple shelter or dig into a hillside before night falls.
5. Kill sheep for **wool** and craft a **bed** to skip the night and set your spawn point.
6. Gather food — cooked meat restores more hunger than raw.

## Progression
Wood → Stone → Iron → Diamond → Netherite. Find **diamonds** deep underground (Y level −58 is ideal), enter the **Nether**, find **Strongholds** with Eyes of Ender, and defeat the **Ender Dragon**.
`,
      },
    ],
  },
];
