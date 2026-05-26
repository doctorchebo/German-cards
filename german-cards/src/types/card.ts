export type LanguageCode = 'de';

export type Card = {
  id: number;
  key?: string;
  language: LanguageCode;
  prompt: string;
  answer: string;
};

export type DrillCard = {
  id: number;
  key: string;
  prompt: string;
  answer: string;
};

export type DrillSession = {
  drillId: number;
  cards: DrillCard[];
};

export type DrillResult = {
  right: number;
  wrong: number;
  wrongCardIds: number[];
};
