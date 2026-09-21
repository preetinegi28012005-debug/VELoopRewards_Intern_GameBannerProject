import type { RewardOption } from '../types/models';

export const REWARD_OPTIONS: RewardOption[] = [
  {
    id: 've-pack',
    kind: 'ves',
    title: 'VE Pack',
    description: 'Convert Game Coins into VELOOP Energy (VE).',
    quantity: 1,
    cost: 40,
  },
  {
    id: 'sve-pack',
    kind: 'sves',
    title: 'SVE Pack',
    description: 'A rarer Super VELOOP Energy conversion.',
    quantity: 1,
    cost: 90,
  },
  {
    id: 'gem-cluster',
    kind: 'gems',
    title: 'Gem Cluster',
    description: 'Five gems for cosmetic and boost unlocks.',
    quantity: 5,
    cost: 25,
  },
  {
    id: 'token-refill',
    kind: 'tokens',
    title: 'Token Refill',
    description: 'Trade Game Coins back into play Tokens.',
    quantity: 20,
    cost: 35,
  },
  {
    id: 'spin-ticket',
    kind: 'spins',
    title: 'Spin Ticket',
    description: 'One lucky spin for future prize wheels.',
    quantity: 1,
    cost: 30,
  },
];
