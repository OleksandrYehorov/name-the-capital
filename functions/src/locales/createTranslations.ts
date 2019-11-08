import { en, Translations } from './en';
import { ru } from './ru';
import { en as enCountriesData, ru as ruCountriesData } from '../data.json';
import { CountryData } from '../types';

export const getTranslations = (locale: string): Translations => {
  if (locale.startsWith('ru')) {
    return ru;
  }

  return en;
};

export const getCountries = (locale: string): CountryData[] => {
  if (locale.startsWith('ru')) {
    return ruCountriesData;
  }

  return enCountriesData;
};
