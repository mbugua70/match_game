import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Clock, Target } from 'lucide-react';

const products = [
  { name: 'Tomatoes', color: 'red', emoji: '🍅' },
  { name: 'Coca-Cola', color: 'red', emoji: '🥤' },
  { name: 'Strawberries', color: 'red', emoji: '🍓' },
  { name: 'Red Pepper', color: 'red', emoji: '🌶️' },
  { name: 'Watermelon', color: 'red', emoji: '🍉' },

  { name: 'Lettuce', color: 'green', emoji: '🥬' },
  { name: 'Broccoli', color: 'green', emoji: '🥦' },
  { name: 'Green Apple', color: 'green', emoji: '🍏' },
  { name: 'Cucumber', color: 'green', emoji: '🥒' },
  { name: 'Avocado', color: 'green', emoji: '🥑' },

  { name: 'Water Bottle', color: 'blue', emoji: '💧' },
  { name: 'Milk', color: 'blue', emoji: '🥛' },
  { name: 'Blueberries', color: 'blue', emoji: '🫐' },
  { name: 'Fish', color: 'blue', emoji: '🐟' },
  { name: 'Ice Cream', color: 'blue', emoji: '🍦' },

  { name: 'Banana', color: 'yellow', emoji: '🍌' },
  { name: 'Cheese', color: 'yellow', emoji: '🧀' },
  { name: 'Bread', color: 'yellow', emoji: '🍞' },
  { name: 'Corn', color: 'yellow', emoji: '🌽' },
  { name: 'Lemon', color: 'yellow', emoji: '🍋' }
];

const colorConfig = {
  red: { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'Red', icon: '🟥' },
  green: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'Green', icon: '🟩' },
  blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'Blue', icon: '🟦' },
  yellow: { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'Yellow', icon: '🟨' }
};

export default function CarrefourColorRush() {
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [shake, setShake] = useState(false);
  const [flyingProduct, setFlyingProduct] = useState(null);
  const [usedProducts, setUsedProducts] = useState([]);

  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  const playSuccessSound = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1000;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.2);
  }, []);

  const showNewProduct = useCallback(() => {
    const availableProducts = products.filter(p => !usedProducts.includes(p.name));

    if (availableProducts.length === 0) {
      setUsedProducts([]);
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      setCurrentProduct(randomProduct);
      return;
    }

    const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    setCurrentProduct(randomProduct);
  }, [usedProducts]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('ended');
            setCurrentProduct(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && !currentProduct && !isProcessingRef.current) {
      showNewProduct();
    }
  }, [gameState, currentProduct, showNewProduct]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(45);
    setUsedProducts([]);
    setCurrentProduct(null);
    setFlyingProduct(null);
    isProcessingRef.current = false;
  };

  const handleColorTap = (color) => {
    if (!currentProduct || gameState !== 'playing' || isProcessingRef.current) return;

    if (currentProduct.color === color) {
      isProcessingRef.current = true;

      playSuccessSound();
      const newScore = score + 1;
      setScore(newScore);

      setFlyingProduct({ ...currentProduct, targetColor: color });
      setUsedProducts(prev => [...prev, currentProduct.name]);
      setCurrentProduct(null);

      if (newScore >= 12) {
        setTimeout(() => {
          setFlyingProduct(null);
          setGameState('ended');
          if (timerRef.current) clearInterval(timerRef.current);
        }, 600);
      } else {
        setTimeout(() => {
          setFlyingProduct(null);
          isProcessingRef.current = false;
          showNewProduct();
        }, 600);
      }

    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const getQuadrantPosition = (color) => {
    switch(color) {
      case 'red': return 'top-1/4 left-1/4';
      case 'green': return 'top-1/4 right-1/4';
      case 'blue': return 'bottom-1/4 left-1/4';
      case 'yellow': return 'bottom-1/4 right-1/4';
      default: return 'top-1/2 left-1/2';
    }
  };

  if (gameState === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #0055A5, #00387B, #002855)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#00387B' }}>Carrefour</h1>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0055A5' }}>Color Rush</h2>
          <p className="text-gray-600 mb-6">Spot the products, tap the color, win big!</p>

          <div className="rounded-xl p-6 mb-6 text-left" style={{ backgroundColor: '#E6F0FF' }}>
            <h3 className="font-bold mb-3" style={{ color: '#00387B' }}>How to Play:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>🎯 Match products to their color quadrants</li>
              <li>⚡ Tap as fast as you can!</li>
              <li>🏆 Get 12 correct matches in 45 seconds to win</li>
              <li>❌ Wrong taps waste time, so think quick!</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="w-full text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#0055A5' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00387B'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0055A5'}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    const won = score >= 12;
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #0055A5, #00387B, #002855)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="text-6xl mb-4">{won ? '🎉' : '⏰'}</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#00387B' }}>
            {won ? 'You Win!' : 'Time\'s Up!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {won ? 'Amazing memory skills!' : 'Good try! Keep practicing!'}
          </p>

          <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#E6F0FF' }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-5xl font-bold" style={{ color: '#00387B' }}>{score}</span>
            </div>
            <p className="text-gray-600">Products Matched</p>
          </div>

          <button
            onClick={startGame}
            className="w-full text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#0055A5' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00387B'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0055A5'}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden select-none">
      <div className="p-4 flex items-center justify-between z-10 shadow-lg" style={{ backgroundColor: '#0055A5' }}>
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-xl">{score}/12</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-white" />
          <span className={`text-white font-bold text-xl transition-colors ${timeLeft <= 10 ? 'animate-pulse text-red-300' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-1 p-1">
        <button
          onClick={() => handleColorTap('red')}
          className={`${colorConfig.red.bg} ${colorConfig.red.hover} relative transition-all active:scale-95 flex flex-col items-center justify-center touch-none`}
        >
          <div className="text-6xl mb-2">🍅</div>
          <div className="text-white font-bold text-xl drop-shadow-lg">{colorConfig.red.text}</div>
        </button>

        <button
          onClick={() => handleColorTap('green')}
          className={`${colorConfig.green.bg} ${colorConfig.green.hover} relative transition-all active:scale-95 flex flex-col items-center justify-center touch-none`}
        >
          <div className="text-6xl mb-2">🥬</div>
          <div className="text-white font-bold text-xl drop-shadow-lg">{colorConfig.green.text}</div>
        </button>

        <button
          onClick={() => handleColorTap('blue')}
          className={`${colorConfig.blue.bg} ${colorConfig.blue.hover} relative transition-all active:scale-95 flex flex-col items-center justify-center touch-none`}
        >
          <div className="text-6xl mb-2">💧</div>
          <div className="text-white font-bold text-xl drop-shadow-lg">{colorConfig.blue.text}</div>
        </button>

        <button
          onClick={() => handleColorTap('yellow')}
          className={`${colorConfig.yellow.bg} ${colorConfig.yellow.hover} relative transition-all active:scale-95 flex flex-col items-center justify-center touch-none`}
        >
          <div className="text-6xl mb-2">🍌</div>
          <div className="text-white font-bold text-xl drop-shadow-lg">{colorConfig.yellow.text}</div>
        </button>
      </div>

      {currentProduct && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className={`bg-white rounded-3xl shadow-2xl p-8 transition-all duration-200 ${shake ? 'animate-bounce' : 'animate-in zoom-in fade-in duration-300'}`}>
            <div className="text-8xl mb-4">{currentProduct.emoji}</div>
            <div className="text-2xl font-bold text-gray-800">{currentProduct.name}</div>
          </div>
        </div>
      )}

      {flyingProduct && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-500 ease-in-out ${getQuadrantPosition(flyingProduct.targetColor)}`}
          style={{
            transform: 'scale(0.3)',
            opacity: 0
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-8xl">{flyingProduct.emoji}</div>
          </div>
        </div>
      )}
    </div>
  );
}