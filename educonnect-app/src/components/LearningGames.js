import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Volume2, Star, Trophy, ArrowLeft, Play, 
  Check, X, Award, Heart, Sparkles, Target, Edit3, Calendar,
  FileText, User, Home, Phone, Mail, MapPin, Cake, Hash, Globe
} from 'lucide-react';



// Language data
const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
  
};

const TRANSLATIONS = {

  weekdays: {
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    mfe: ['Lindi', 'Mardi', 'Merkredi', 'Zedi', 'Vandredi', 'Samdi', 'Dimans']
  },
  colors: {
  en: {
    Red: 'Red',
    Blue: 'Blue',
    Green: 'Green',
    Yellow: 'Yellow',
    Purple: 'Purple',
    Pink: 'Pink',
    Orange: 'Orange',
    Cyan: 'Cyan'
  },
  fr: {
    Red: 'Rouge',
    Blue: 'Bleu',
    Green: 'Vert',
    Yellow: 'Jaune',
    Purple: 'Violet',
    Pink: 'Rose',
    Orange: 'Orange',
    Cyan: 'Cyan'
  }
 
},
  months: {
    en: [
      { name: 'January', emoji: '❄️', days: 31 },
      { name: 'February', emoji: '💝', days: 28 },
      { name: 'March', emoji: '🌸', days: 31 },
      { name: 'April', emoji: '🌧️', days: 30 },
      { name: 'May', emoji: '🌺', days: 31 },
      { name: 'June', emoji: '☀️', days: 30 },
      { name: 'July', emoji: '🏖️', days: 31 },
      { name: 'August', emoji: '🌻', days: 31 },
      { name: 'September', emoji: '🍂', days: 30 },
      { name: 'October', emoji: '🎃', days: 31 },
      { name: 'November', emoji: '🦃', days: 30 },
      { name: 'December', emoji: '🎄', days: 31 }
    ],
    fr: [
      { name: 'Janvier', emoji: '❄️', days: 31 },
      { name: 'Février', emoji: '💝', days: 28 },
      { name: 'Mars', emoji: '🌸', days: 31 },
      { name: 'Avril', emoji: '🌧️', days: 30 },
      { name: 'Mai', emoji: '🌺', days: 31 },
      { name: 'Juin', emoji: '☀️', days: 30 },
      { name: 'Juillet', emoji: '🏖️', days: 31 },
      { name: 'Août', emoji: '🌻', days: 31 },
      { name: 'Septembre', emoji: '🍂', days: 30 },
      { name: 'Octobre', emoji: '🎃', days: 31 },
      { name: 'Novembre', emoji: '🦃', days: 30 },
      { name: 'Décembre', emoji: '🎄', days: 31 }
    ]
    
  },
  numbers: {
    en: {
      1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five',
      6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
      11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen',
      16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty'
    },
    fr: {
      1: 'Un', 2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq',
      6: 'Six', 7: 'Sept', 8: 'Huit', 9: 'Neuf', 10: 'Dix',
      11: 'Onze', 12: 'Douze', 13: 'Treize', 14: 'Quatorze', 15: 'Quinze',
      16: 'Seize', 17: 'Dix-sept', 18: 'Dix-huit', 19: 'Dix-neuf', 20: 'Vingt'
    },
   
  },
  words: {
    en: [
      { word: 'Apple', image: '🍎', category: 'Fruit' },
      { word: 'Ball', image: '⚽', category: 'Toy' },
      { word: 'Cat', image: '🐱', category: 'Animal' },
      { word: 'Dog', image: '🐕', category: 'Animal' },
      { word: 'Elephant', image: '🐘', category: 'Animal' },
      { word: 'Fish', image: '🐟', category: 'Animal' },
      { word: 'Grapes', image: '🍇', category: 'Fruit' },
      { word: 'House', image: '🏠', category: 'Building' },
      { word: 'Ice Cream', image: '🍦', category: 'Food' },
      { word: 'Sun', image: '☀️', category: 'Nature' },
      { word: 'Tree', image: '🌳', category: 'Nature' },
      { word: 'Water', image: '💧', category: 'Nature' }
    ],
    fr: [
      { word: 'Pomme', image: '🍎', category: 'Fruit' },
      { word: 'Ballon', image: '⚽', category: 'Jouet' },
      { word: 'Chat', image: '🐱', category: 'Animal' },
      { word: 'Chien', image: '🐕', category: 'Animal' },
      { word: 'Éléphant', image: '🐘', category: 'Animal' },
      { word: 'Poisson', image: '🐟', category: 'Animal' },
      { word: 'Raisin', image: '🍇', category: 'Fruit' },
      { word: 'Maison', image: '🏠', category: 'Bâtiment' },
      { word: 'Glace', image: '🍦', category: 'Nourriture' },
      { word: 'Soleil', image: '☀️', category: 'Nature' },
      { word: 'Arbre', image: '🌳', category: 'Nature' },
      { word: 'Eau', image: '💧', category: 'Nature' }
    ],
  },
  formFields: {
    en: {
      firstName: { label: 'First Name', placeholder: 'e.g., John', help: 'Your first name is what people call you' },
      lastName: { label: 'Last Name', placeholder: 'e.g., Smith', help: 'Your family name or surname' },
      age: { label: 'Age', placeholder: 'e.g., 12', help: 'How old are you in years?' },
      country: { label: 'Country', placeholder: 'e.g., Mauritius', help: 'Which country do you live in?' },
      city: { label: 'City', placeholder: 'e.g., Port Louis', help: 'Which city or town do you live in?' }
    },
    fr: {
      firstName: { label: 'Prénom', placeholder: 'ex., Jean', help: 'Votre prénom est comment les gens vous appellent' },
      lastName: { label: 'Nom de famille', placeholder: 'ex., Dupont', help: 'Votre nom de famille' },
      age: { label: 'Âge', placeholder: 'ex., 12', help: 'Quel âge avez-vous en années?' },
      country: { label: 'Pays', placeholder: 'ex., Maurice', help: 'Dans quel pays vivez-vous?' },
      city: { label: 'Ville', placeholder: 'ex., Port-Louis', help: 'Dans quelle ville habitez-vous?' }
    },

  }
};

const LearningGames = ({ onClose }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  
  // Game selection menu
  const games = [
    {
      id: 'alphabet-tracing',
      name: 'Learn ABC',
      icon: Edit3,
      description: 'Learn to write letters A to Z',
      color: 'from-red-500 to-orange-500',
      category: 'Writing'
    },
    {
      id: 'name-writing',
      name: 'Write Your Name',
      icon: User,
      description: 'Practice writing your own name',
      color: 'from-purple-500 to-pink-500',
      category: 'Writing'
    },
    {
      id: 'weekdays',
      name: 'Days of the Week',
      icon: Calendar,
      description: 'Learn Monday to Sunday',
      color: 'from-blue-500 to-cyan-500',
      category: 'Reading'
    },
    {
      id: 'months',
      name: 'Months of the Year',
      icon: Calendar,
      description: 'Learn all 12 months',
      color: 'from-green-500 to-teal-500',
      category: 'Reading'
    },
    {
      id: 'numbers',
      name: 'Learn Numbers',
      icon: Hash,
      description: 'Count from 1 to 20',
      color: 'from-yellow-500 to-orange-500',
      category: 'Numbers'
    },
    {
      id: 'form-filling',
      name: 'Fill a Form',
      icon: FileText,
      description: 'Practice filling out forms',
      color: 'from-indigo-500 to-purple-500',
      category: 'Life Skills'
    },
    {
      id: 'color-match',
      name: 'Color Matching',
      icon: Palette,
      description: 'Match colors and learn their names',
      color: 'from-pink-500 to-purple-500',
      category: 'Colors'
    },
    {
      id: 'sound-words',
      name: 'Learn Words',
      icon: Volume2,
      description: 'Listen and learn English words',
      color: 'from-blue-500 to-cyan-500',
      category: 'Reading'
    },
    {
      id: 'common-signs',
      name: 'Important Signs',
      icon: MapPin,
      description: 'Learn street and safety signs',
      color: 'from-red-500 to-pink-500',
      category: 'Life Skills'
    }
  ];

  const showRewardAnimation = () => {
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  if (!currentGame) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 z-50 overflow-y-auto">
        <div className="max-w-md mx-auto p-4 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Learning Games</h1>
            <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg">
              <Star className="text-yellow-500" size={20} />
              <span className="font-bold">{score}</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Let's Learn Together! 🎉
            </h2>
            <p className="text-gray-600">
              Choose a game to start learning
            </p>
          </div>

          {/* Game Categories */}
          {['Writing', 'Reading', 'Numbers', 'Life Skills', 'Colors'].map(category => {
            const categoryGames = games.filter(g => g.category === category);
            if (categoryGames.length === 0) return null;
            
            return (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-bold text-gray-700 mb-3 px-2">
                  {category}
                </h3>
                <div className="space-y-3">
                  {categoryGames.map(game => {
                    const Icon = game.icon;
                    return (
                      <button
                        key={game.id}
                        onClick={() => setCurrentGame(game.id)}
                        className="w-full bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="text-white" size={28} />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-base font-bold text-gray-800 mb-0.5">
                              {game.name}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {game.description}
                            </p>
                          </div>
                          <Play className="text-gray-400" size={20} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render specific game
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 z-50 overflow-y-auto">
      {currentGame === 'alphabet-tracing' && (
        <AlphabetTracingGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
      {currentGame === 'name-writing' && (
        <NameWritingGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
      {currentGame === 'weekdays' && (
        <WeekdaysGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
      {currentGame === 'months' && (
        <MonthsGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
      {currentGame === 'numbers' && (
        <NumbersGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
      {currentGame === 'form-filling' && (
        <FormFillingGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
      {currentGame === 'common-signs' && (
        <CommonSignsGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            }
          }}
          currentStreak={streak}
        />
      )}
      
   {currentGame === 'color-match' && (
        <ColorMatchGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            } else {
              setStreak(0);
            }
          }}
          currentStreak={streak}
    
        />
      )}
      
      {currentGame === 'sound-words' && (
        <SoundWordsGame 
          onBack={() => setCurrentGame(null)}
          onScoreUpdate={(points) => {
            setScore(prev => prev + points);
            if (points > 0) {
              setStreak(prev => prev + 1);
              showRewardAnimation();
            } else {
              setStreak(0);
            }
          }}
          currentStreak={streak}
        />
      )}

      {/* Reward Animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="animate-bounce">
            <div className="text-6xl">⭐</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Language Selector Component
const LanguageSelector = ({ selectedLang, onSelectLang }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Globe className="text-blue-600" size={24} />
        <h3 className="text-lg font-bold text-gray-800">Choose Language</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(LANGUAGES).map(([code, lang]) => (
          <button
            key={code}
            onClick={() => onSelectLang(code)}
            className={`p-4 rounded-lg border-2 transition transform hover:scale-105 active:scale-95 ${
              selectedLang === code
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-3xl mb-2">{lang.flag}</div>
            <div className="text-sm font-bold text-gray-800">{lang.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ALPHABET TRACING GAME (No changes - English only)
// ============================================================================

const AlphabetTracingGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [roundScore, setRoundScore] = useState(0);

  const currentLetter = alphabet[currentLetterIndex];

  const speakLetter = (letter) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 0.7;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    speakLetter(currentLetter);
  }, [currentLetter]);

  const handleNext = () => {
    if (userInput.toUpperCase() === currentLetter) {
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      speakLetter('Correct! ' + currentLetter);
    } else {
      speakLetter('Try again: ' + currentLetter);
    }
    
    setUserInput('');
    setShowAnswer(false);
    
    if (currentLetterIndex < alphabet.length - 1) {
      setCurrentLetterIndex(prev => prev + 1);
    } else {
      alert(`Great job! You completed the alphabet! Score: ${roundScore + (userInput.toUpperCase() === currentLetter ? 10 : 0)}`);
      onBack();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-white rounded-lg shadow hover:shadow-md transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Learn ABC</h2>
          <p className="text-sm text-gray-600">Letter {currentLetterIndex + 1} of {alphabet.length}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-500"
          style={{ width: `${((currentLetterIndex + 1) / alphabet.length) * 100}%` }}
        />
      </div>

      {/* Letter Display */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <div className="text-9xl font-bold text-blue-600 mb-4" style={{ fontFamily: 'serif' }}>
          {currentLetter}
        </div>
        
        <button
          onClick={() => speakLetter(currentLetter)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition mb-4"
        >
          <Volume2 size={20} />
          Hear Letter
        </button>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-gray-600 text-sm underline"
        >
          {showAnswer ? 'Hide' : 'Show'} How to Write
        </button>
      </div>

      {/* Writing Area */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
        <h3 className="font-bold text-gray-800 mb-3 text-center">
          Write the letter {currentLetter}
        </h3>
        
        {showAnswer && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
            <p className="text-9xl font-bold text-blue-400 text-center opacity-40" style={{ fontFamily: 'serif' }}>
              {currentLetter}
            </p>
          </div>
        )}
        
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.slice(0, 1))}
          placeholder="Type here..."
          className="w-full text-6xl font-bold text-center p-4 border-4 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          style={{ fontFamily: 'serif' }}
          maxLength={1}
          autoCapitalize="characters"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setUserInput('')}
          className="bg-gray-500 text-white py-4 rounded-lg hover:bg-gray-600 transition font-bold"
        >
          Clear
        </button>
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// NAME WRITING GAME (No changes - Language independent)
// ============================================================================

const NameWritingGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const [studentName, setStudentName] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [attempts, setAttempts] = useState(0);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSetup = () => {
    if (studentName.trim().length >= 2) {
      setSetupComplete(true);
      speakText(`Great! Now practice writing ${studentName}`);
    } else {
      alert('Please enter your name (at least 2 letters)');
    }
  };

  const handleCheck = () => {
    if (userInput.toLowerCase() === studentName.toLowerCase()) {
      onScoreUpdate(20);
      speakText('Perfect! You wrote your name correctly!');
      
      setTimeout(() => {
        if (window.confirm('Great job! Do you want to practice again?')) {
          setUserInput('');
          setAttempts(prev => prev + 1);
        } else {
          onBack();
        }
      }, 1500);
    } else {
      speakText('Not quite right. Try again!');
      setShowGuide(true);
    }
  };

  if (!setupComplete) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="p-2 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Write Your Name</h2>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="text-white" size={40} />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            What is your name?
          </h3>
          
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full text-3xl font-bold text-center p-4 border-4 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none mb-6"
            autoFocus
          />
          
          <button
            onClick={handleSetup}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold text-lg"
          >
            Start Practice →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-white rounded-lg shadow hover:shadow-md transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Write Your Name</h2>
          <p className="text-sm text-gray-600">Practice #{attempts + 1}</p>
        </div>
        <button
          onClick={() => speakText(studentName)}
          className="p-2 bg-blue-500 text-white rounded-lg shadow"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Name to Copy */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6 text-center">
        <p className="text-sm text-gray-600 mb-3">Your name is:</p>
        <div className="text-5xl font-bold text-purple-600 mb-4" style={{ fontFamily: 'cursive' }}>
          {studentName}
        </div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm text-gray-600 underline"
        >
          {showGuide ? 'Hide' : 'Show'} Guide
        </button>
      </div>

      {/* Writing Area */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
        <h3 className="font-bold text-gray-800 mb-4 text-center">
          Now you write it:
        </h3>
        
        {showGuide && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300">
            <p className="text-5xl font-bold text-purple-300 text-center" style={{ fontFamily: 'cursive' }}>
              {studentName}
            </p>
          </div>
        )}
        
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your name..."
          className="w-full text-4xl font-bold text-center p-4 border-4 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
          style={{ fontFamily: 'cursive' }}
        />
        
        {/* Letter by letter hints */}
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          {studentName.split('').map((letter, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                userInput[index]?.toLowerCase() === letter.toLowerCase()
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
            >
              {userInput[index] || '?'}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setUserInput('')}
          className="bg-gray-500 text-white py-4 rounded-lg hover:bg-gray-600 transition font-bold"
        >
          Clear
        </button>
        <button
          onClick={handleCheck}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold"
        >
          Check ✓
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// WEEKDAYS GAME - WITH LANGUAGE SUPPORT
// ============================================================================

const WeekdaysGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [roundScore, setRoundScore] = useState(0);
  const [mode, setMode] = useState('learn');

  const weekdays = selectedLang ? TRANSLATIONS.weekdays[selectedLang] : [];

  useEffect(() => {
    if (mode === 'quiz' && selectedLang) {
      generateOptions();
    }
  }, [currentDayIndex, mode, selectedLang]);

  const generateOptions = () => {
    const correct = weekdays[currentDayIndex];
    const wrong = weekdays.filter(d => d !== correct);
    const shuffled = [
      correct,
      ...wrong.sort(() => Math.random() - 0.5).slice(0, 2)
    ].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
  };

  const speakDay = (day) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(day);
      utterance.rate = 0.7;
      utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (selectedDay) => {
    if (selectedDay === weekdays[currentDayIndex]) {
      setFeedback('correct');
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      speakDay('Correct! ' + selectedDay);
      
      setTimeout(() => {
        if (currentDayIndex < weekdays.length - 1) {
          setCurrentDayIndex(prev => prev + 1);
          setFeedback(null);
        } else {
          alert(`Great job! You learned all 7 days! Score: ${roundScore + 10}`);
          onBack();
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      speakDay('Try again');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (!selectedLang) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Days of the Week</h2>
          <div className="w-10"></div>
        </div>
        <LanguageSelector selectedLang={selectedLang} onSelectLang={setSelectedLang} />
      </div>
    );
  }

  if (mode === 'learn') {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedLang(null)} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Days of the Week</h2>
            <p className="text-sm text-gray-600">{LANGUAGES[selectedLang].flag} {LANGUAGES[selectedLang].name}</p>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg mb-6">
          <h3 className="text-center text-xl font-bold text-gray-700 mb-6">
            Learn the 7 Days 📅
          </h3>
          
          <div className="space-y-3">
            {weekdays.map((day, index) => (
              <button
                key={day}
                onClick={() => speakDay(day)}
                className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95 flex items-center justify-between"
              >
                <span className="text-2xl font-bold">{index + 1}</span>
                <span className="text-2xl font-bold">{day}</span>
                <Volume2 size={24} />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setMode('quiz')}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold text-lg"
        >
          Start Quiz! 🎯
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setMode('learn')} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Quiz Time!</h2>
          <p className="text-sm text-gray-600">Day {currentDayIndex + 1} of 7</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 bg-white rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-500"
          style={{ width: `${((currentDayIndex + 1) / 7) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          What is day #{currentDayIndex + 1}?
        </h3>
        <p className="text-gray-600 mb-4">
          {currentDayIndex === 0 && "First day of the week"}
          {currentDayIndex === 6 && "Last day of the week"}
          {currentDayIndex > 0 && currentDayIndex < 6 && `After ${weekdays[currentDayIndex - 1]}`}
        </p>
        <button
          onClick={() => speakDay(weekdays[currentDayIndex])}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          Hear the Day
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((day) => (
          <button
            key={day}
            onClick={() => handleAnswer(day)}
            disabled={feedback !== null}
            className={`
              bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95 text-xl font-bold
              ${feedback === 'correct' && day === weekdays[currentDayIndex] ? 'ring-4 ring-green-500 bg-green-50' : ''}
              ${feedback === 'wrong' && day !== weekdays[currentDayIndex] ? 'opacity-50' : ''}
            `}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            ✓ Perfect!
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MONTHS GAME - WITH LANGUAGE SUPPORT
// ============================================================================

const MonthsGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [mode, setMode] = useState('learn');
  const [userInput, setUserInput] = useState('');
  const [roundScore, setRoundScore] = useState(0);

  const months = selectedLang ? TRANSLATIONS.months[selectedLang] : [];

  const speakMonth = (month) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(month);
      utterance.rate = 0.7;
      utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = () => {
    if (userInput.toLowerCase() === months[currentMonthIndex].name.toLowerCase()) {
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      speakMonth('Correct! ' + months[currentMonthIndex].name);
      
      setTimeout(() => {
        if (currentMonthIndex < months.length - 1) {
          setCurrentMonthIndex(prev => prev + 1);
          setUserInput('');
        } else {
          alert(`Amazing! You learned all 12 months! Score: ${roundScore + 10}`);
          onBack();
        }
      }, 1500);
    } else {
      speakMonth('Try again');
    }
  };

  if (!selectedLang) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Months of the Year</h2>
          <div className="w-10"></div>
        </div>
        <LanguageSelector selectedLang={selectedLang} onSelectLang={setSelectedLang} />
      </div>
    );
  }

  if (mode === 'learn') {
    return (
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedLang(null)} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">12 Months</h2>
            <p className="text-sm text-gray-600">{LANGUAGES[selectedLang].flag} {LANGUAGES[selectedLang].name}</p>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-center text-xl font-bold text-gray-700 mb-6">
            Months of the Year 📆
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {months.map((month, index) => (
              <button
                key={month.name}
                onClick={() => speakMonth(month.name)}
                className="bg-gradient-to-br from-blue-400 to-purple-400 text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95"
              >
                <div className="text-3xl mb-2">{month.emoji}</div>
                <div className="text-xs font-semibold mb-1">{index + 1}</div>
                <div className="text-sm font-bold">{month.name}</div>
                <div className="text-xs mt-1 opacity-80">{month.days} days</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setMode('practice')}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold text-lg"
        >
          Practice Writing! ✍️
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setMode('learn')} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Practice</h2>
          <p className="text-sm text-gray-600">Month {currentMonthIndex + 1} of 12</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      <div className="mb-6 bg-white rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-500"
          style={{ width: `${((currentMonthIndex + 1) / 12) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <div className="text-6xl mb-4">{months[currentMonthIndex].emoji}</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Month #{currentMonthIndex + 1}
        </h3>
        <p className="text-4xl font-bold text-purple-600 mb-4" style={{ fontFamily: 'cursive' }}>
          {months[currentMonthIndex].name}
        </p>
        <button
          onClick={() => speakMonth(months[currentMonthIndex].name)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          Hear Month
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
        <h3 className="font-bold text-gray-800 mb-4 text-center">
          Write the month name:
        </h3>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type here..."
          className="w-full text-3xl font-bold text-center p-4 border-4 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
          style={{ fontFamily: 'cursive' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setUserInput('')}
          className="bg-gray-500 text-white py-4 rounded-lg hover:bg-gray-600 transition font-bold"
        >
          Clear
        </button>
        <button
          onClick={handleCheck}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold"
        >
          Check ✓
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// NUMBERS GAME - WITH LANGUAGE SUPPORT
// ============================================================================

const NumbersGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [mode, setMode] = useState('learn');
  const [userInput, setUserInput] = useState('');
  const [roundScore, setRoundScore] = useState(0);
  const maxNumber = 20;

  const numberWords = selectedLang ? TRANSLATIONS.numbers[selectedLang] : {};

  const speakNumber = (num) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(num.toString());
      utterance.rate = 0.7;
      utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = () => {
    if (parseInt(userInput) === currentNumber) {
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      speakNumber(`Correct! ${currentNumber}`);
      
      setTimeout(() => {
        if (currentNumber < maxNumber) {
          setCurrentNumber(prev => prev + 1);
          setUserInput('');
        } else {
          alert(`Excellent! You learned numbers 1 to 20! Score: ${roundScore + 10}`);
          onBack();
        }
      }, 1500);
    } else {
      speakNumber('Try again');
    }
  };

  if (!selectedLang) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Learn Numbers</h2>
          <div className="w-10"></div>
        </div>
        <LanguageSelector selectedLang={selectedLang} onSelectLang={setSelectedLang} />
      </div>
    );
  }

  if (mode === 'learn') {
    return (
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedLang(null)} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Learn Numbers</h2>
            <p className="text-sm text-gray-600">{LANGUAGES[selectedLang].flag} {LANGUAGES[selectedLang].name}</p>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-center text-xl font-bold text-gray-700 mb-6">
            Numbers 1 to 20 🔢
          </h3>
          
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => speakNumber(num)}
                className="aspect-square bg-gradient-to-br from-yellow-400 to-orange-400 text-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-110 active:scale-95 flex flex-col items-center justify-center"
              >
                <div className="text-3xl font-bold">{num}</div>
                <div className="text-xs font-semibold mt-1">{numberWords[num]}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setMode('practice')}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold text-lg"
        >
          Practice Writing! ✍️
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setMode('learn')} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Practice Numbers</h2>
          <p className="text-sm text-gray-600">Number {currentNumber} of {maxNumber}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      <div className="mb-6 bg-white rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500"
          style={{ width: `${(currentNumber / maxNumber) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Count the dots:
        </h3>
        
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {Array.from({ length: currentNumber }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-blue-500 rounded-full"></div>
          ))}
        </div>

        <p className="text-5xl font-bold text-orange-600 mb-4">
          {numberWords[currentNumber]}
        </p>
        
        <button
          onClick={() => speakNumber(currentNumber)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          Hear Number
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
        <h3 className="font-bold text-gray-800 mb-4 text-center">
          Write the number:
        </h3>
        <input
          type="number"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type number..."
          className="w-full text-6xl font-bold text-center p-4 border-4 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
          min="1"
          max={maxNumber}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setUserInput('')}
          className="bg-gray-500 text-white py-4 rounded-lg hover:bg-gray-600 transition font-bold"
        >
          Clear
        </button>
        <button
          onClick={handleCheck}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold"
        >
          Check ✓
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// FORM FILLING GAME - WITH LANGUAGE SUPPORT
// ============================================================================

const FormFillingGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    country: '',
    city: ''
  });
  
  const [currentField, setCurrentField] = useState('firstName');
  const [completedFields, setCompletedFields] = useState([]);

  const fieldsList = [
    { id: 'firstName', icon: User, type: 'text' },
    { id: 'lastName', icon: User, type: 'text' },
    { id: 'age', icon: Cake, type: 'number' },
    { id: 'country', icon: MapPin, type: 'text' },
    { id: 'city', icon: Home, type: 'text' }
  ];

  const fields = selectedLang ? fieldsList.map(f => ({
    ...f,
    ...TRANSLATIONS.formFields[selectedLang][f.id]
  })) : [];

  const currentFieldData = fields.find(f => f.id === currentField);
  const currentFieldIndex = fields.findIndex(f => f.id === currentField);
  const Icon = currentFieldData?.icon;

  const speakText = (text) => {
    if ('speechSynthesis' in window && selectedLang) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7;
      utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentFieldData) {
      speakText(currentFieldData.label + '. ' + currentFieldData.help);
    }
  }, [currentField, selectedLang]);

  const handleNext = () => {
    if (formData[currentField].trim()) {
      if (!completedFields.includes(currentField)) {
        setCompletedFields([...completedFields, currentField]);
        onScoreUpdate(20);
      }
      
      const nextIndex = currentFieldIndex + 1;
      if (nextIndex < fields.length) {
        setCurrentField(fields[nextIndex].id);
      } else {
        speakText('Great job! You filled the whole form!');
        setTimeout(() => {
          alert(`Excellent! You completed the form!\n\nName: ${formData.firstName} ${formData.lastName}\nAge: ${formData.age}\nLocation: ${formData.city}, ${formData.country}`);
          onBack();
        }, 2000);
      }
    } else {
      speakText('Please fill in this field');
      alert('Please fill in this field before continuing');
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentFieldIndex - 1;
    if (prevIndex >= 0) {
      setCurrentField(fields[prevIndex].id);
    }
  };

  if (!selectedLang) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Fill a Form</h2>
          <div className="w-10"></div>
        </div>
        <LanguageSelector selectedLang={selectedLang} onSelectLang={setSelectedLang} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setSelectedLang(null)} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Fill a Form</h2>
          <p className="text-sm text-gray-600">Field {currentFieldIndex + 1} of {fields.length}</p>
        </div>
        <button
          onClick={() => speakText(currentFieldData.help)}
          className="p-2 bg-blue-500 text-white rounded-lg shadow"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6 bg-white rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-400 to-purple-500 h-full transition-all duration-500"
          style={{ width: `${((currentFieldIndex + 1) / fields.length) * 100}%` }}
        />
      </div>

      {/* Current Field */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
            <Icon className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            {currentFieldData.label}
          </h3>
        </div>

        <p className="text-center text-gray-600 mb-6 text-lg">
          {currentFieldData.help}
        </p>

        <input
          type={currentFieldData.type}
          value={formData[currentField]}
          onChange={(e) => setFormData({ ...formData, [currentField]: e.target.value })}
          placeholder={currentFieldData.placeholder}
          className="w-full text-2xl font-bold text-center p-4 border-4 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Preview of Completed Fields */}
      {completedFields.length > 0 && (
        <div className="bg-green-50 rounded-xl p-4 mb-6 border-2 border-green-200">
          <h4 className="font-bold text-green-800 mb-2 text-center">✓ Completed:</h4>
          <div className="space-y-1 text-sm">
            {completedFields.map(fieldId => {
              const field = fields.find(f => f.id === fieldId);
              return (
                <div key={fieldId} className="flex justify-between">
                  <span className="text-gray-600">{field.label}:</span>
                  <span className="font-bold text-gray-800">{formData[fieldId]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentFieldIndex === 0}
          className="bg-gray-500 text-white py-4 rounded-lg hover:bg-gray-600 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold"
        >
          {currentFieldIndex === fields.length - 1 ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SOUND WORDS GAME - WITH LANGUAGE SUPPORT
// ============================================================================

const SoundWordsGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [roundScore, setRoundScore] = useState(0);
  const [showWord, setShowWord] = useState(false);

  const words = selectedLang ? TRANSLATIONS.words[selectedLang] : [];

  useEffect(() => {
    if (selectedLang) {
      generateNewRound();
    }
  }, [selectedLang]);

  const generateNewRound = () => {
    const correct = words[Math.floor(Math.random() * words.length)];
    const wrongOptions = words.filter(w => w.word !== correct.word);
    const shuffled = [
      correct,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    setCurrentWord(correct);
    setOptions(shuffled);
    setFeedback(null);
    setShowWord(false);
    
    setTimeout(() => speakWord(correct.word), 500);
  };

  const speakWord = (word) => {
    if ('speechSynthesis' in window && selectedLang) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.7;
      utterance.pitch = 1.2;
      utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (selectedWord) => {
    if (selectedWord.word === currentWord.word) {
      setFeedback('correct');
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      setShowWord(true);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Excellent! ${currentWord.word}`);
        utterance.rate = 0.8;
        utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      
      setTimeout(() => {
        generateNewRound();
      }, 2000);
    } else {
      setFeedback('wrong');
      onScoreUpdate(0);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Try again!');
        utterance.rate = 0.8;
        utterance.lang = selectedLang === 'fr' ? 'fr-FR' : selectedLang === 'mfe' ? 'fr-MU' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      
      setTimeout(() => {
        setFeedback(null);
        speakWord(currentWord.word);
      }, 1500);
    }
  };

  if (!selectedLang) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Learn Words</h2>
          <div className="w-10"></div>
        </div>
        <LanguageSelector selectedLang={selectedLang} onSelectLang={setSelectedLang} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setSelectedLang(null)} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Learn Words</h2>
          <p className="text-sm text-gray-600">{LANGUAGES[selectedLang].flag} {LANGUAGES[selectedLang].name}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Volume2 className="text-white" size={48} />
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Listen and tap the correct picture!
        </h3>
        
        <button
          onClick={() => speakWord(currentWord?.word)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          Play Again
        </button>
        
        {showWord && (
          <div className="mt-4 text-3xl font-bold text-green-600 animate-bounce">
            {currentWord.word}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((item, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(item)}
            disabled={feedback !== null}
            className={`
              bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition
              ${feedback === 'correct' && item.word === currentWord.word ? 'ring-4 ring-green-500' : ''}
            `}
          >
            <div className="text-6xl mb-3">{item.image}</div>
            {showWord && (
              <p className="text-sm font-bold text-gray-800">{item.word}</p>
            )}
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            ✓ Perfect!
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMMON SIGNS GAME (No changes - English only for safety signs)
// ============================================================================

const CommonSignsGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const signs = [
    { name: 'STOP', emoji: '🛑', color: 'red', description: 'Stop your vehicle completely' },
    { name: 'EXIT', emoji: '🚪', color: 'green', description: 'Way out of a building' },
    { name: 'TOILET/WC', emoji: '🚻', color: 'blue', description: 'Bathroom or restroom' },
    { name: 'NO ENTRY', emoji: '⛔', color: 'red', description: 'Do not enter this area' },
    { name: 'DANGER', emoji: '⚠️', color: 'yellow', description: 'Be very careful here' },
    { name: 'HOSPITAL', emoji: '🏥', color: 'blue', description: 'Medical help available' },
    { name: 'POLICE', emoji: '👮', color: 'blue', description: 'Police station or officer' },
    { name: 'SCHOOL', emoji: '🏫', color: 'yellow', description: 'School zone - drive slowly' },
    { name: 'PUSH', emoji: '👉', color: 'gray', description: 'Push to open door' },
    { name: 'PULL', emoji: '👈', color: 'gray', description: 'Pull to open door' }
  ];

  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [mode, setMode] = useState('learn');
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [roundScore, setRoundScore] = useState(0);

  const speakSign = (sign) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sign);
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (mode === 'quiz') {
      generateOptions();
    }
  }, [currentSignIndex, mode]);

  const generateOptions = () => {
    const correct = signs[currentSignIndex];
    const wrong = signs.filter(s => s.name !== correct.name);
    const shuffled = [
      correct,
      ...wrong.sort(() => Math.random() - 0.5).slice(0, 2)
    ].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
  };

  const handleAnswer = (selectedSign) => {
    if (selectedSign.name === signs[currentSignIndex].name) {
      setFeedback('correct');
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      speakSign('Correct! ' + selectedSign.name);
      
      setTimeout(() => {
        if (currentSignIndex < signs.length - 1) {
          setCurrentSignIndex(prev => prev + 1);
          setFeedback(null);
        } else {
          alert(`Great! You learned all important signs! Score: ${roundScore + 10}`);
          onBack();
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      speakSign('Try again');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (mode === 'learn') {
    return (
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Important Signs</h2>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-center text-xl font-bold text-gray-700 mb-6">
            Learn These Signs 🚸
          </h3>
          
          <div className="space-y-3">
            {signs.map((sign) => (
              <button
                key={sign.name}
                onClick={() => speakSign(sign.name + '. ' + sign.description)}
                className="w-full bg-white border-4 border-gray-200 hover:border-blue-400 p-4 rounded-lg shadow-lg transition transform hover:scale-105 active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{sign.emoji}</div>
                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold text-gray-800">{sign.name}</div>
                    <div className="text-sm text-gray-600">{sign.description}</div>
                  </div>
                  <Volume2 size={24} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setMode('quiz')}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-lg hover:shadow-lg transition font-bold text-lg"
        >
          Test Your Knowledge! 🎯
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setMode('learn')} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Quiz</h2>
          <p className="text-sm text-gray-600">Sign {currentSignIndex + 1} of {signs.length}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      <div className="mb-6 bg-white rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-red-400 to-orange-500 h-full transition-all duration-500"
          style={{ width: `${((currentSignIndex + 1) / signs.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <div className="text-8xl mb-4">{signs[currentSignIndex].emoji}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          What does this sign mean?
        </h3>
        <button
          onClick={() => speakSign(signs[currentSignIndex].description)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          Hear Description
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((sign) => (
          <button
            key={sign.name}
            onClick={() => handleAnswer(sign)}
            disabled={feedback !== null}
            className={`
              bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95 text-lg font-bold
              ${feedback === 'correct' && sign.name === signs[currentSignIndex].name ? 'ring-4 ring-green-500 bg-green-50' : ''}
              ${feedback === 'wrong' && sign.name !== signs[currentSignIndex].name ? 'opacity-50' : ''}
            `}
          >
            {sign.name}
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            ✓ Excellent!
          </div>
        </div>
      )}
    </div>
  );
};

const ColorMatchGame = ({ onBack, onScoreUpdate, currentStreak, language }) => {
  const [selectedLang, setSelectedLang] = useState(language || null);
  const [currentColor, setCurrentColor] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [feedbackColor, setFeedbackColor] = useState(null); // NEW: freeze color for feedback
  const [lives, setLives] = useState(3);
  const [roundScore, setRoundScore] = useState(0);

  const colors = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Cyan', hex: '#06B6D4' }
  ];

  const langData = selectedLang ? TRANSLATIONS.colors[selectedLang] : {};

  useEffect(() => {
    if (selectedLang) generateNewRound();
  }, [selectedLang]);

  const generateNewRound = () => {
    const correct = colors[Math.floor(Math.random() * colors.length)];
    const wrongOptions = colors.filter(c => c.name !== correct.name);
    const shuffled = [
      correct,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);

    setCurrentColor(correct);
    setOptions(shuffled);
    setFeedback(null);
    setFeedbackColor(null);
  };

  const speakColorName = (text) => {
    if ('speechSynthesis' in window && selectedLang) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7;
      utterance.lang =
        selectedLang === 'fr'
          ? 'fr-FR'
          : selectedLang === 'mfe'
          ? 'fr-MU'
          : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (selectedOption) => {
    const colorName = langData[selectedOption.name] || selectedOption.name;

    if (selectedOption.name === currentColor.name) {
      setFeedback('correct');
      setFeedbackColor(currentColor); // freeze the correct color for feedback
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);

      speakColorName(`${langData.correct || 'Correct!'} ${colorName}`);

      setTimeout(() => {
        generateNewRound();
      }, 1500);
    } else {
      setFeedback('wrong');
      setFeedbackColor(selectedOption); // optional: show wrong color
      setLives(prev => prev - 1);
      onScoreUpdate(0);

      speakColorName(langData.tryAgain || 'Try again!');

      setTimeout(() => setFeedback(null), 1000);

      if (lives <= 1) {
        setTimeout(() => {
          alert(`${langData.gameOver || 'Game Over!'} ${roundScore} ⭐`);
          onBack();
        }, 1000);
      }
    }
  };

  if (!selectedLang) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white rounded-lg shadow">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Color Matching</h2>
          <div className="w-10"></div>
        </div>
        <LanguageSelector selectedLang={selectedLang} onSelectLang={setSelectedLang} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setSelectedLang(null)} className="p-2 bg-white rounded-lg shadow">
          <ArrowLeft size={24} />
        </button>

        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              size={24}
              className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-300'}
            />
          ))}
        </div>

        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      {/* Color Display */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <h2 className="text-xl font-bold mb-4">{langData.whatColor || 'What color is this?'}</h2>

        <div
          className="w-48 h-48 mx-auto rounded-3xl shadow-xl mb-4"
          style={{ backgroundColor: currentColor?.hex }}
        />

        <button
          onClick={() => speakColorName(langData[currentColor.name] || currentColor.name)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          {langData.hearColor || 'Hear the Color'}
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((color, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(color)}
            disabled={feedback !== null}
            className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition
              ${
                feedback === 'correct' && color.name === currentColor.name
                  ? 'ring-4 ring-green-500'
                  : ''
              }
            `}
          >
            <div
              className="w-16 h-16 mx-auto rounded-xl mb-3 shadow"
              style={{ backgroundColor: color.hex }}
            />
            <p className="font-bold text-gray-800">{langData[color.name] || color.name}</p>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback === 'correct' && feedbackColor && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            ✓ {langData.greatJob || 'Great Job!'}
          </div>
        </div>
      )}
    </div>
  );
};




export default LearningGames;
