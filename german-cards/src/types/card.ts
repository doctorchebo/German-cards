export type LanguageCode = 'de';

export type Card = {
  id: number;
  language: LanguageCode;
  prompt: string;
  answer: string;
};

export type DrillCard = {
  id: number;
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

