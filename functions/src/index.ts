import { https } from 'firebase-functions';
import {
  dialogflow,
  Suggestions,
  Permission,
  Parameters,
} from 'actions-on-google';
import { deburr } from 'lodash';

import { getTranslations, getCountries } from './locales/createTranslations';
import { getRandomInt } from './utils/getRandomInt';
import {
  Conversation,
  TranslationsPlugin,
  CountryData,
  DifficultyLevel,
} from './types';

const app = dialogflow<Conversation>({ debug: true });

app.middleware(conv => {
  const translations = getTranslations(conv.user.locale);
  const countries = getCountries(conv.user.locale);

  const plugin: TranslationsPlugin = {
    translations,
    countries,
  };

  Object.assign(conv, plugin);
});

app.intent('Default Welcome Intent', conv => {
  const { userName } = conv.user.storage;

  if (userName) {
    conv.ask(
      `${conv.translations.welcome(userName)} ${conv.translations.askForAGame}`,
    );
    conv.ask(new Suggestions([conv.translations.yes, conv.translations.no]));
    conv.contexts.set('StartGame', 2);

    return;
  }

  conv.ask(
    new Permission({
      context: conv.translations.initialWelcome,
      permissions: 'NAME',
    }),
  );
  conv.ask(new Suggestions([conv.translations.yes, conv.translations.no]));
});

app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  conv.contexts.set('StartGame', 2);

  if (permissionGranted) {
    const userName = conv.user.name.display || 'Anonymous';

    conv.user.storage.userName = userName;

    conv.ask(
      `${conv.translations.thanksUsername(userName)} ${
        conv.translations.askForAGame
      }`,
    );
    conv.ask(new Suggestions([conv.translations.yes, conv.translations.no]));

    return;
  }

  conv.ask(`${conv.translations.noWorries} ${conv.translations.askForAGame}`);
  conv.ask(new Suggestions([conv.translations.yes, conv.translations.no]));
});

type Range = { from: number; to: number };

const difficultyLevelMap: Record<DifficultyLevel, Range> = {
  easy: { from: 40_000_000, to: Infinity },
  hard: { from: 10_000_000, to: 40_000_000 },
  insane: { from: 0, to: 10_000_000 },
};

const inRange = (value: number, { from, to }: Range): boolean => {
  return value > from && value < to;
};

const getCountry = (
  countries: CountryData[],
  difficultyLevel: DifficultyLevel,
): CountryData => {
  const index = getRandomInt(0, countries.length - 1);
  const county = countries[index];

  if (inRange(county.population, difficultyLevelMap[difficultyLevel])) {
    return county;
  } else {
    return getCountry(countries, difficultyLevel);
  }
};

const playRound = (conv: Conversation): void => {
  const { difficultyLevel = 'easy' } = conv.data;
  const currentCountry = getCountry(conv.countries, difficultyLevel);

  conv.data.currentCountry = currentCountry;

  if (typeof conv.data.score !== 'number') {
    conv.data.score = -1;
    conv.ask(`${conv.translations.rules}
    ${currentCountry.countryName}`);
  } else {
    conv.ask(currentCountry.countryName);
  }

  conv.contexts.set('Playing', 2);
  conv.data.score = conv.data.score + 1;
};

app.intent('Play Game', conv => {
  if (conv.data.difficultyLevel) {
    playRound(conv);
    return;
  }

  conv.ask(conv.translations.chooseDifficultyLevel);
  conv.ask(
    new Suggestions([
      conv.translations.easy,
      conv.translations.hard,
      conv.translations.insane,
    ]),
  );
  conv.contexts.set('ChooseDifficultyLevel', 2);
});

interface ChooseDifficultyLevelParams extends Parameters {
  difficultyLevel?: DifficultyLevel;
}

app.intent<ChooseDifficultyLevelParams>(
  ['Choose Difficulty Level', 'Game Round - yes'],
  (conv, { difficultyLevel }) => {
    if (difficultyLevel) {
      conv.ask(
        conv.translations.difficultyLevel(conv.translations[difficultyLevel]),
      );
      conv.data.difficultyLevel = difficultyLevel;
      conv.contexts.set('Playing', 2);
      playRound(conv);
      return;
    }
  },
);

interface GameRoundParams extends Parameters {
  city?: string;
}

const compareStrings = (s1: string, s2: string): boolean => {
  const normalizeString = (string: string): string =>
    deburr(string)
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  return normalizeString(s1) === normalizeString(s2);
};

app.intent<GameRoundParams>('Game Round', (conv, params, userInput) => {
  const city = String(params.city || userInput);
  const { currentCountry, score } = conv.data;

  if (currentCountry && typeof score === 'number') {
    if (compareStrings(currentCountry.capital, city)) {
      conv.ask(conv.translations.correct);
    } else {
      conv.ask(
        `${conv.translations.incorrect(
          currentCountry.capital,
        )} ${conv.translations.score(score)} ${conv.translations.playAgain}`,
      );
      conv.ask(new Suggestions([conv.translations.yes, conv.translations.no]));
      conv.contexts.set('StartGame', 2);
      conv.data = {};
      return;
    }
  }

  playRound(conv);
  conv.contexts.set('Playing', 7);
});

exports.dialogflowFirebaseFulfillment = https.onRequest(app);
