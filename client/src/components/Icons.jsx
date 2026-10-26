import {
  BookOpen,
  Cards,
  Compass,
  Cpu,
  Crosshair,
  Crown,
  Drop,
  GameController,
  Hammer,
  Lightbulb,
  Lightning,
  ListMagnifyingGlass,
  MagicWand,
  MapTrifold,
  Moon,
  Parachute,
  PersonSimpleRun,
  Planet,
  Plant,
  Ranking,
  Scroll,
  Sparkle,
  Strategy,
  Sword,
  TextItalic,
  Translate,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react';

// Wiki sections store an icon name in the database; map it to a Phosphor component.
const SECTION_ICONS = {
  BookOpen,
  Cards,
  Compass,
  Cpu,
  Crosshair,
  Crown,
  Drop,
  Hammer,
  Lightbulb,
  Lightning,
  ListMagnifyingGlass,
  MagicWand,
  MapTrifold,
  Moon,
  Parachute,
  PersonSimpleRun,
  Planet,
  Plant,
  Ranking,
  Sparkle,
  Sword,
  TextItalic,
  Translate,
  Trophy,
  UsersThree,
};

export function SectionIcon({ name, size = 22, ...props }) {
  const Icon = SECTION_ICONS[name] || Scroll;
  return <Icon size={size} weight="bold" aria-hidden="true" {...props} />;
}

const CATEGORY_ICONS = { video: GameController, board: Strategy, card: Cards };

export function CategoryIcon({ category, size = 22, weight = 'bold', ...props }) {
  const Icon = CATEGORY_ICONS[category] || GameController;
  return <Icon size={size} weight={weight} aria-hidden="true" {...props} />;
}
