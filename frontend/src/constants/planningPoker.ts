export const POKER_VALUES = [
  "0.5",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "?",
] as const;

export type PokerValue =
  (typeof POKER_VALUES)[number];