export const LANGUAGE_CONFIG = {
  en: {
    code: 'en-US',
    rate: 0.8,
    correct: 'Correct!',
    tryAgain: 'Try again!',
    greatJob: 'Great job!',
    hearColor: 'Hear the Color',
    whatColor: 'What color is this?',
    learnWords: 'Learn Words',
    listenTap: 'Listen and tap the correct picture!',
    playAgain: 'Play Again',
    gameOver: 'Game Over! You scored'
  },
  fr: {
    code: 'fr-FR',
    rate: 0.75,
    correct: 'Correct !',
    tryAgain: 'Essaie encore !',
    greatJob: 'Bravo !',
    hearColor: 'Écouter la couleur',
    whatColor: 'Quelle couleur est-ce ?',
    learnWords: 'Apprendre les mots',
    listenTap: 'Écoute et touche la bonne image !',
    playAgain: 'Rejouer',
    gameOver: 'Partie terminée ! Tu as marqué'
  }
};

export const speak = (text, lang = 'en') => {
  if (!('speechSynthesis' in window)) return;

  const voices = window.speechSynthesis.getVoices();
  const config = LANGUAGE_CONFIG[lang];

  const voice =
    voices.find(v => v.lang.startsWith(config.code.split('-')[0])) || null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = config.code;
  utterance.voice = voice;
  utterance.rate = config.rate;

  window.speechSynthesis.speak(utterance);
};
