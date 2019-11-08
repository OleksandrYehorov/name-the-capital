export const en = {
  yes: 'Yes',
  no: 'No',
  thanksUsername: (userName: string): string => `Thanks ${userName}!`,
  initialWelcome: 'Welcome to "Name the Capital" quiz! Can I ask your name?',
  welcome: (userName: string): string => `Hello again, ${userName}!`,
  bye: 'Goodbye!',
  noWorries: 'Ok, no worries.',
  askForAGame: 'Do you want to play?',
  correct: 'Correct!',
  incorrect: (capital: string): string => `Correct answer is ${capital}.`,
  score: (score: number): string => `Your score is ${score}.`,
  playAgain: 'Do you want to play again?',
  rules: 'Rules are easy. I say country and you name the capital.',
  chooseDifficultyLevel: 'Please choose difficulty level.',
  difficultyLevel: (difficultyLevel: string): string =>
    `Your difficulty level - ${difficultyLevel}.`,
  easy: 'Easy',
  hard: 'Hard',
  insane: 'Insane',
};

export type Translations = typeof en;
