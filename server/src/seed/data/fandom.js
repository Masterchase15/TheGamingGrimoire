// Fandom (MediaWiki) wiki for each game: `wiki` is the subdomain of
// https://<wiki>.fandom.com, `page` the article that describes the game, and
// `topics` the featured articles shown on the game page. Titles are checked
// against the live wiki at runtime; missing or redirected-away ones are dropped.
// Games without a usable Fandom wiki (Ticket to Ride, Azul, Codenames,
// One Piece Card Game, Texas Hold'em, UNO) simply have no entry.

export default {
  'elden-ring': {
    wiki: 'eldenring',
    page: 'Elden Ring (game)',
    topics: ['Origins', 'Stats and Attributes', 'Bosses', 'Weapons', 'Armor', 'Talismans', 'Ashes of War', 'Ashes', 'Incantations', 'Sorceries', 'Lands Between', 'Locations', 'NPCs', 'Remembrances', 'Status Effects', 'Endings', 'Elden Ring: Shadow of the Erdtree'],
  },
  'baldurs-gate-3': {
    wiki: 'baldursgate',
    page: "Baldur's Gate III",
    topics: ['Classes', 'Companions', 'Romance'],
  },
  'the-witcher-3': {
    wiki: 'witcher',
    page: 'The Witcher 3: Wild Hunt',
    topics: ['Geralt of Rivia', 'Ciri', 'Yennefer of Vengerberg', 'Triss Merigold', 'Sign', 'Alchemy', 'Gwent', 'Hearts of Stone', 'Blood and Wine'],
  },
  'hollow-knight': {
    wiki: 'hollowknight',
    page: 'Hollow Knight',
    topics: ['Hallownest', 'Nail', 'Mask Shard', 'Grub', 'Godhome', 'Pantheons', 'Achievements (Hollow Knight)'],
  },
  'hollow-knight-silksong': {
    wiki: 'hollowknight',
    page: 'Hollow Knight: Silksong',
    topics: ['Hornet', 'Pharloom', 'Crests'],
  },
  'zelda-tears-of-the-kingdom': {
    wiki: 'zelda',
    page: 'The Legend of Zelda: Tears of the Kingdom',
    topics: ['Link', 'Princess Zelda', 'Ganondorf', 'Ultrahand', 'Fuse', 'Ascend', 'Recall', 'Autobuild', 'Zonai Device', 'Sky Islands', 'The Depths', 'Ancient Shrine', 'Korok'],
  },
  'red-dead-redemption-2': {
    wiki: 'reddead',
    page: 'Red Dead Redemption 2',
    topics: ['Arthur Morgan', 'John Marston', 'Dutch van der Linde', 'Van der Linde gang', 'Honor', 'Horse', 'Weapons in Redemption 2', 'Missions in Redemption 2', 'Legendary Animals', 'Red Dead Online'],
  },
  hades: {
    wiki: 'hades',
    page: 'Hades',
    topics: ['Zagreus', 'Boons', 'Infernal Arms', 'Mirror of Night', 'Keepsakes', 'Companions', 'Olympians', 'Tartarus', 'Asphodel', 'Elysium', 'Temple of Styx', 'Heat', 'Pact of Punishment'],
  },
  'clair-obscur-expedition-33': {
    wiki: 'clair-obscur',
    page: 'Clair Obscur: Expedition 33',
    topics: ['Gustave', 'Maelle', 'Lune', 'Sciel', 'Verso', 'Monoco', 'Battles', 'Pictos', 'Weapons', 'The Paintress', 'Expedition 33', 'Lumière', 'Nevron'],
  },
  'cyberpunk-2077': {
    wiki: 'cyberpunk',
    page: 'Cyberpunk 2077',
    topics: ['V (character)', 'Johnny Silverhand', 'Night City', 'Cyberware', 'Phantom Liberty', 'Cyberpunk 2077 Endings', 'Cyberpunk 2077 Vehicles'],
  },
  'stardew-valley': {
    wiki: 'stardewvalley',
    page: 'Stardew Valley',
    topics: ['Crops', 'Seasons', 'Villagers', 'Marriage', 'Community Center', 'Bundles', 'Animals', 'Artisan Goods', 'Skills', 'Fishing', 'Mining', 'The Mines', 'Skull Cavern', 'Festivals', 'Ginger Island'],
  },
  'god-of-war-ragnarok': {
    wiki: 'godofwar',
    page: 'God of War Ragnarök',
    topics: ['Kratos', 'Atreus', 'Freya', 'Mimir', 'Odin', 'Thor', 'Leviathan Axe', 'Blades of Chaos', 'Draupnir Spear', 'Spartan Rage', 'Nine Realms', 'Berserkers', 'Valkyries'],
  },
  celeste: {
    wiki: 'celestegame',
    page: 'Celeste',
    topics: ['Madeline', 'Badeline', 'Theo', 'Old Woman', 'Collectibles', 'Farewell'],
  },
  'destiny-2': {
    wiki: 'destiny',
    page: 'Destiny 2',
    topics: ['Guardian', 'Titan', 'Hunter', 'Warlock', 'Subclass', 'Prismatic', 'Light', 'The Darkness', 'Rarity', 'Raid', 'Dungeon', 'Crucible', 'Gambit', 'Vanguard', 'The Final Shape'],
  },
  'helldivers-2': {
    wiki: 'helldivers',
    page: 'Helldivers 2',
    topics: ['Stratagems', 'Support Weapons', 'Boosters', 'Warbonds', 'Super Destroyer', 'Difficulty', 'Terminids', 'Automatons', 'Illuminate'],
  },
  'counter-strike-2': {
    wiki: 'counterstrike',
    page: 'Counter-Strike 2',
    topics: ['Premier', 'Competitive', 'Wingman', 'Map', 'Dust II', 'Mirage', 'Inferno', 'Weapons', 'AK-47', 'M4A4', 'AWP', 'Grenades'],
  },
  'call-of-duty-warzone': {
    wiki: 'callofduty',
    page: 'Call of Duty: Warzone',
    topics: ['Battle Royale', 'Plunder', 'Gulag', 'Loadout Drop', 'Buy Station', 'Contracts (Multiplayer)', 'Killstreak', 'Verdansk', 'Rebirth Island', 'Urzikstan'],
  },
  'battlefield-6': {
    wiki: 'battlefield',
    page: 'Battlefield 6',
    topics: ['Conquest', 'Breakthrough', 'Rush', 'Engineer', 'Support', 'Recon', 'Battlefield Portal', 'Battlefield REDSEC', 'Destruction'],
  },
  fortnite: {
    wiki: 'fortnite',
    page: 'Fortnite',
    topics: ['Fortnite: Battle Royale', 'Fortnite: Battle Royale/Zero Build', 'Fortnite Festival', 'Rocket Racing', 'Fortnite: Creative', 'Fortnite: Save the World', 'Weaponry', 'Rarity', 'Battle Pass', 'The Storm', 'Shield Potion', 'Seasons'],
  },
  valorant: {
    wiki: 'valorant',
    page: 'VALORANT',
    topics: ['Agents', 'Jett', 'Sova', 'Omen', 'Sage', 'Maps', 'Weapons', 'Spike', 'Competitive'],
  },
  'league-of-legends': {
    wiki: 'leagueoflegends',
    page: 'League of Legends',
    topics: ["Summoner's Rift", 'Champion', 'Item (League of Legends)', 'Rune (League of Legends)', 'Summoner spell', 'Jungling', 'Minion (League of Legends)', 'Turret', 'Nexus', 'Ward', 'Dragon', 'Baron Nashor', 'ARAM', 'Ranked game'],
  },
  minecraft: {
    wiki: 'minecraft',
    page: 'Minecraft',
    topics: ['Survival', 'Creative', 'Hardcore', 'Crafting', 'Biome', 'Mob', 'Villager', 'Diamond', 'Netherite', 'Redstone Dust', 'Enchanting', 'Brewing', 'The Nether', 'The End', 'Ender Dragon'],
  },
  catan: {
    wiki: 'catan',
    page: 'Catan',
    topics: ['Settlement', 'City', 'Road', 'Harbor', 'Development card', 'The Robber', 'Longest Road', 'Largest Army', 'Catan: Seafarers', 'Catan: Cities & Knights'],
  },
  pandemic: {
    wiki: 'pandemic',
    page: 'Pandemic',
    topics: ['Roles', 'Medic', 'Scientist', 'Researcher', 'Dispatcher'],
  },
  wingspan: {
    wiki: 'wingspan',
    page: 'Expansions',
    topics: [],
  },
  gloomhaven: {
    wiki: 'gloomhaven',
    page: 'Gloomhaven',
    topics: ['Classes', 'Brute', 'Tinkerer', 'Spellweaver', 'Scoundrel', 'Cragheart', 'Mindthief', 'Scenarios', 'Monsters', 'Items', 'Conditions and Effects', 'Elements', 'Gloomhaven: Jaws of the Lion', 'Frosthaven'],
  },
  chess: {
    wiki: 'chess',
    page: 'Chess',
    topics: ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn', 'Castling', 'En passant', 'Checkmate', 'Stalemate', 'Opening', 'Sicilian Defense', "Queen's Gambit", 'Magnus Carlsen'],
  },
  'terraforming-mars': {
    wiki: 'terraformingmars',
    page: 'TM/Main Game',
    topics: ['TM/Rulebook', 'TM/Video Game', 'TM/Terraformer'],
  },
  'magic-the-gathering': {
    wiki: 'mtg',
    page: 'Magic: The Gathering',
    topics: ['Mana', 'Color', 'Stack', 'Mulligan', 'Planeswalker', 'Keyword ability', 'Keyword action', 'Ability word', 'Commander (format)', 'Standard', 'Pioneer', 'Modern', 'Legacy', 'Vintage', 'Limited', 'Draft'],
  },
  'pokemon-tcg': {
    wiki: 'pokemon',
    page: 'Pokémon Trading Card Game',
    topics: ['Energy card', 'Resistance', 'Pokémon TCG Live', 'Pokémon Trading Card Game Pocket'],
  },
  'yu-gi-oh': {
    wiki: 'yugioh',
    page: 'Yu-Gi-Oh! Trading Card Game',
    topics: ['Extra Deck', 'Fusion Monster', 'Ritual Monster', 'Synchro Monster', 'Xyz Monster', 'Pendulum Monster', 'Link Monster', 'Spell Card', 'Trap Card', 'Chain', 'Yu-Gi-Oh! Master Duel', 'Dark Magician', 'Blue-Eyes White Dragon'],
  },
  hearthstone: {
    wiki: 'hearthstone',
    page: 'Hearthstone',
    topics: ['Class', 'Hero Power', 'Mana', 'Battlecry', 'Deathrattle', 'Taunt', 'Divine Shield', 'Discover', 'Standard format', 'Wild format', 'Arena', 'Battlegrounds', 'Expansion'],
  },
  'disney-lorcana': {
    wiki: 'lorcana',
    page: 'Lorcana',
    topics: ['Card Layout', 'Keywords', 'Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'],
  },
};
