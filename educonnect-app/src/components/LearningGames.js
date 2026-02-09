import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Volume2, Star, Trophy, ArrowLeft, Play, 
  Check, X, Award, Heart, Sparkles, Target
} from 'lucide-react';

const LearningGames = ({ onClose }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  
  // Game selection menu
  const games = [
    {
      id: 'color-match',
      name: 'Color Matching',
      icon: Palette,
      description: 'Match colors and learn their names',
      color: 'from-pink-500 to-purple-500'
    },
    {
      id: 'sound-words',
      name: 'Learn Words',
      icon: Volume2,
      description: 'Listen and learn English words',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'memory-match',
      name: 'Memory Game',
      icon: Target,
      description: 'Match pairs and improve memory',
      color: 'from-green-500 to-teal-500'
    }
  ];

  const showRewardAnimation = () => {
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  if (!currentGame) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 z-50 overflow-y-auto">
        <div className="max-w-md mx-auto p-4">
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
              Choose a fun game to play and learn
            </p>
          </div>

          {/* Game Cards */}
          <div className="space-y-4">
            {games.map(game => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  onClick={() => setCurrentGame(game.id)}
                  className="w-full bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="text-white" size={32} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {game.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {game.description}
                      </p>
                    </div>
                    <Play className="text-gray-400" size={24} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress Stats */}
          {score > 0 && (
            <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Your Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="text-yellow-600" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{score}</p>
                  <p className="text-sm text-gray-600">Total Stars</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="text-green-600" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{streak}</p>
                  <p className="text-sm text-gray-600">Best Streak</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render specific game
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 z-50 overflow-y-auto">
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
      
      {currentGame === 'memory-match' && (
        <MemoryMatchGame 
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

// ============================================================================
// COLOR MATCHING GAME
// ============================================================================

const ColorMatchGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const colors = [
    { name: 'Red', hex: '#EF4444', rgb: 'rgb(239, 68, 68)' },
    { name: 'Blue', hex: '#3B82F6', rgb: 'rgb(59, 130, 246)' },
    { name: 'Green', hex: '#10B981', rgb: 'rgb(16, 185, 129)' },
    { name: 'Yellow', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)' },
    { name: 'Purple', hex: '#8B5CF6', rgb: 'rgb(139, 92, 246)' },
    { name: 'Pink', hex: '#EC4899', rgb: 'rgb(236, 72, 153)' },
    { name: 'Orange', hex: '#F97316', rgb: 'rgb(249, 115, 22)' },
    { name: 'Cyan', hex: '#06B6D4', rgb: 'rgb(6, 182, 212)' }
  ];

  const [currentColor, setCurrentColor] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [lives, setLives] = useState(3);
  const [roundScore, setRoundScore] = useState(0);

  useEffect(() => {
    generateNewRound();
  }, []);

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
  };

  const handleAnswer = (selectedColor) => {
    if (selectedColor.name === currentColor.name) {
      setFeedback('correct');
      onScoreUpdate(10);
      setRoundScore(prev => prev + 10);
      
      // Speak the color name
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Correct! ${currentColor.name}`);
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }
      
      setTimeout(() => {
        generateNewRound();
      }, 1500);
    } else {
      setFeedback('wrong');
      setLives(prev => prev - 1);
      onScoreUpdate(0);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Try again!');
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }
      
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
      
      if (lives <= 1) {
        setTimeout(() => {
          alert(`Game Over! You scored ${roundScore} points!`);
          onBack();
        }, 1000);
      }
    }
  };

  const speakColorName = () => {
    if ('speechSynthesis' in window && currentColor) {
      const utterance = new SpeechSynthesisUtterance(currentColor.name);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
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
        <div className="flex items-center gap-2">
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

      {/* Streak Badge */}
      {currentStreak > 2 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg text-center mb-4 font-bold animate-pulse">
          🔥 {currentStreak} Streak!
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          What color is this?
        </h2>
        
        <div 
          className="w-48 h-48 mx-auto rounded-3xl shadow-xl mb-4 transform transition hover:scale-105"
          style={{ backgroundColor: currentColor?.hex }}
        />
        
        <button
          onClick={speakColorName}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition"
        >
          <Volume2 size={20} />
          Hear the Color
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((color, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(color)}
            disabled={feedback !== null}
            className={`
              bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95
              ${feedback === 'correct' && color.name === currentColor.name ? 'ring-4 ring-green-500' : ''}
              ${feedback === 'wrong' && color.name === currentColor.name ? 'ring-4 ring-green-500' : ''}
              ${feedback === 'wrong' && color.name !== currentColor.name ? 'opacity-50' : ''}
            `}
          >
            <div 
              className="w-16 h-16 mx-auto rounded-xl mb-3 shadow"
              style={{ backgroundColor: color.hex }}
            />
            <p className="text-lg font-bold text-gray-800">
              {color.name}
            </p>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            ✓ Great Job!
          </div>
        </div>
      )}
      
      {feedback === 'wrong' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-red-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            ✗ Try Again!
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SOUND/WORDS GAME
// ============================================================================

const SoundWordsGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const words = [
    { word: 'Apple', image: '🍎', category: 'Fruit' },
    { word: 'Ball', image: '⚽', category: 'Toy' },
    { word: 'Cat', image: '🐱', category: 'Animal' },
    { word: 'Dog', image: '🐕', category: 'Animal' },
    { word: 'Elephant', image: '🐘', category: 'Animal' },
    { word: 'Fish', image: '🐟', category: 'Animal' },
    { word: 'Grapes', image: '🍇', category: 'Fruit' },
    { word: 'House', image: '🏠', category: 'Building' },
    { word: 'Ice Cream', image: '🍦', category: 'Food' },
    { word: 'Juice', image: '🧃', category: 'Drink' },
    { word: 'Kite', image: '🪁', category: 'Toy' },
    { word: 'Lion', image: '🦁', category: 'Animal' },
    { word: 'Moon', image: '🌙', category: 'Nature' },
    { word: 'Orange', image: '🍊', category: 'Fruit' },
    { word: 'Pizza', image: '🍕', category: 'Food' },
  ];

  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [roundScore, setRoundScore] = useState(0);
  const [showWord, setShowWord] = useState(false);

  useEffect(() => {
    generateNewRound();
  }, []);

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
    
    // Auto-play the word after a short delay
    setTimeout(() => speakWord(correct.word), 500);
  };

  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.7;
      utterance.pitch = 1.2;
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
        window.speechSynthesis.speak(utterance);
      }
      
      setTimeout(() => {
        generateNewRound();
      }, 2000);
    } else {
      setFeedback('wrong');
      onScoreUpdate(0);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Oops! Listen again');
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }
      
      setTimeout(() => {
        setFeedback(null);
        speakWord(currentWord.word);
      }, 1500);
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
        <h2 className="text-xl font-bold text-gray-800">Learn Words</h2>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      {/* Streak Badge */}
      {currentStreak > 2 && (
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-4 py-2 rounded-lg text-center mb-4 font-bold animate-pulse">
          🔥 {currentStreak} Streak!
        </div>
      )}

      {/* Sound Prompt */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-6 text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Volume2 className="text-white" size={48} />
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Listen and tap the correct picture!
        </h3>
        
        <button
          onClick={() => speakWord(currentWord?.word)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition transform hover:scale-105 active:scale-95"
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

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((item, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(item)}
            disabled={feedback !== null}
            className={`
              bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95
              ${feedback === 'correct' && item.word === currentWord.word ? 'ring-4 ring-green-500' : ''}
              ${feedback === 'wrong' && item.word !== currentWord.word ? 'opacity-50' : ''}
            `}
          >
            <div className="text-6xl mb-3">
              {item.image}
            </div>
            {showWord && (
              <p className="text-sm font-bold text-gray-800">
                {item.word}
              </p>
            )}
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
      
      {feedback === 'wrong' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-orange-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl animate-bounce">
            Try Again! 👂
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MEMORY MATCH GAME
// ============================================================================

const MemoryMatchGame = ({ onBack, onScoreUpdate, currentStreak }) => {
  const emojis = ['🍎', '🎨', '⚽', '🌟', '🎵', '🚗', '🌈', '🎁'];
  
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [roundScore, setRoundScore] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const gameCards = [...emojis, ...emojis]
      .map((emoji, index) => ({ id: index, emoji, flipped: false }))
      .sort(() => Math.random() - 0.5);
    setCards(gameCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        onScoreUpdate(20);
        setRoundScore(prev => prev + 20);
        
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Great match!');
          window.speechSynthesis.speak(utterance);
        }
        
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setTimeout(() => {
        alert(`Congratulations! You won in ${moves} moves! Score: ${roundScore}`);
        initializeGame();
      }, 500);
    }
  }, [matched]);

  const handleCardClick = (index) => {
    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(index)) {
      setFlipped([...flipped, index]);
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
          <h2 className="text-xl font-bold text-gray-800">Memory Match</h2>
          <p className="text-sm text-gray-600">Moves: {moves}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow font-bold">
          {roundScore} ⭐
        </div>
      </div>

      {/* Streak Badge */}
      {currentStreak > 2 && (
        <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-4 py-2 rounded-lg text-center mb-4 font-bold animate-pulse">
          🔥 {currentStreak} Streak!
        </div>
      )}

      {/* Game Board */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`
              aspect-square rounded-xl shadow-lg transition transform
              ${flipped.includes(index) || matched.includes(index)
                ? 'bg-white'
                : 'bg-gradient-to-br from-blue-400 to-purple-500 hover:scale-105'
              }
              ${matched.includes(index) ? 'opacity-50' : ''}
            `}
          >
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {(flipped.includes(index) || matched.includes(index)) ? card.emoji : '?'}
            </div>
          </button>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={initializeGame}
        className="w-full mt-6 bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95"
      >
        🔄 New Game
      </button>
    </div>
  );
};

export default LearningGames;