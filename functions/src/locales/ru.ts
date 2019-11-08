import { Translations } from './en';

export const ru: Translations = {
  yes: 'Да',
  no: 'Нет',
  thanksUsername: (userName: string): string => `Спасибо ${userName}!`,
  initialWelcome:
    'Добро пожаловать в игру "Назови Столицу"! Могу ли я спросить ваше имя?',
  welcome: (userName: string): string => `Снова привет, ${userName}!`,
  bye: 'До свидания!',
  noWorries: 'Без проблем.',
  askForAGame: 'Хотите начать игру?',
  correct: 'Правильно!',
  incorrect: (capital: string): string => `Правильный ответ - ${capital}.`,
  score: (score: number): string => `Ваш результат - ${score}.`,
  playAgain: 'Хотите ли вы сыграть еще?',
  rules: 'Правила простые. Я говорю страну, а вы называете столицу.',
  chooseDifficultyLevel: 'Пожалуйста выберите уровень сложности.',
  difficultyLevel: (difficultyLevel: string): string =>
    `Ваш уровень сложности - ${difficultyLevel}.`,
  easy: 'Легкий',
  hard: 'Сложный',
  insane: 'Бог',
};
