import { Translations } from './locales/en';
import { DialogflowConversation } from 'actions-on-google';

export type DifficultyLevel = 'easy' | 'hard' | 'insane';

type UserStorage = Partial<{
  userName: string;
  bestScore: number;
}>;

type ConvData = Partial<{
  currentCountry: CountryData;
  score: number;
  difficultyLevel: DifficultyLevel;
}>;

export type CountryData = {
  countryName: string;
  capital: string;
  wikiUrl: string;
  population: number;
};

export type TranslationsPlugin = {
  translations: Translations;
  countries: CountryData[];
};

export type Conversation = DialogflowConversation<ConvData, UserStorage> &
  TranslationsPlugin;
