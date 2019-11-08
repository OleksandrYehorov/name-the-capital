import { JSDOM } from 'jsdom';
import { writeFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { deburr } from 'lodash';
import { getNames } from 'i18n-iso-countries';
import { CountryData } from '../src/types';

type Locale = 'en' | 'ru';

type CountryMetaData = {
  capitalRegExp: RegExp;
  populationRegExp: RegExp;
  wikiUrl: string;
};

const metaData: Record<Locale, CountryMetaData> = {
  en: {
    capitalRegExp: /^Capital/,
    populationRegExp: /^Population/,
    wikiUrl: 'https://wikipedia.org/wiki/',
  },
  ru: {
    capitalRegExp: /^Столица/,
    populationRegExp: /^Население/,
    wikiUrl: 'https://ru.wikipedia.org/wiki/',
  },
};

const getCountryName = (document: Document): string | null => {
  const heading = document.querySelector('#firstHeading');

  if (heading && heading.textContent) {
    return heading.textContent.trim();
  }

  return null;
};

const getCapital = (
  document: Document,
  countryMetaData: CountryMetaData,
): string | null => {
  const rows = Array.from(document.querySelectorAll('.infobox tr'));
  const capitalRow = rows.find(element => {
    if (element.textContent) {
      return countryMetaData.capitalRegExp.test(element.textContent.trim());
    }

    return false;
  });

  if (capitalRow) {
    const capitalEl = Array.from(capitalRow.querySelectorAll('td a')).find(
      element => element.textContent !== '',
    );

    return capitalEl ? capitalEl.textContent : null;
  }

  return null;
};

const getPopulation = (
  document: Document,
  countryMetaData: CountryMetaData,
): number | null => {
  const rows = Array.from(document.querySelectorAll('.infobox tr'));
  const populationRow = rows.find(element => {
    return element.textContent
      ? countryMetaData.populationRegExp.test(element.textContent.trim())
      : false;
  });

  if (!populationRow || !populationRow.nextElementSibling) {
    return null;
  }

  const td = populationRow.nextElementSibling.querySelector('td');

  if (!td || !td.textContent) {
    return null;
  }

  const { textContent } = td;
  const firstNumberPosition = textContent
    .split('')
    .findIndex(char => /[0-9]/.test(char));
  const normalizedText = textContent
    .slice(firstNumberPosition)
    .replace(/[\s+,]/g, '');
  const population = Number.parseInt(normalizedText);

  return Number.isNaN(population) ? null : population;
};

type Nullable<T> = { [P in keyof T]: T[P] | null };

const normalizeCountryName = (countryName: string): string => {
  if (countryName.startsWith('КНР') || countryName.startsWith('КНДР')) {
    const index = countryName.indexOf('(');

    return deburr(countryName.slice(0, index).trim());
  }

  return deburr(countryName);
};

const getData = async (locale: Locale): Promise<Nullable<CountryData>[]> => {
  const countryMetaData = metaData[locale];
  const data = await Promise.all(
    Object.values(getNames(locale)).map(async countryName => {
      let errorMessage = '';
      try {
        const wikiUrl = `${countryMetaData.wikiUrl}${encodeURIComponent(
          normalizeCountryName(countryName),
        )}`;
        errorMessage = wikiUrl;
        const response = await fetch(wikiUrl);
        const html = await response.text();
        const { document } = new JSDOM(html).window;

        const localCountryName = getCountryName(document);
        const capital = getCapital(document, countryMetaData);
        const population = getPopulation(document, countryMetaData);

        console.log(`${countryName} - ${population}`);
        return {
          wikiUrl,
          countryName: localCountryName,
          capital,
          population,
        };
      } catch (error) {
        throw new Error(errorMessage);
      }
    }),
  );

  return data;
};

(async (): Promise<void> => {
  try {
    const [rawEn, rawRu] = await Promise.all([getData('en'), getData('ru')]);

    const rawData = JSON.stringify({ en: rawEn, ru: rawRu });

    writeFileSync(join(__dirname, 'rawData.json'), rawData);

    const [en, ru] = [rawEn, rawRu].map(item =>
      item
        .filter(({ capital, countryName }) => {
          return capital && countryName;
        })
        .map(countryData => ({
          ...countryData,
          population: countryData.population || 0,
        }))
        .sort((a, b) => {
          return (a.population || 0) - (b.population || 0);
        }),
    );

    const data = JSON.stringify({ en, ru });

    writeFileSync(join(__dirname, 'data.json'), data);
  } catch (error) {
    console.log(error);
  }
})();
