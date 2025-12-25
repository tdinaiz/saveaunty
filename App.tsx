
import React, { useState, useCallback } from 'react';
import { LEVELS } from './levels';
import { GameStatus, InteractionType } from './types';
import GameEngine from './components/GameEngine';
import { getGameFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [status, setStatus] = useState<GameStatus>(GameStatus.READY);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const currentLevel = LEVELS[currentLevelIndex];

  const handleLevelComplete = useCallback(async (won: boolean) => {
    if (status !== GameStatus.PLAYING) return;
    
    setStatus(won ? GameStatus.WON : GameStatus.FAILED);
    setIsLoadingFeedback(true);
    const text = await getGameFeedback(won ? 'win' : 'fail', currentLevel.title);
    setFeedback(text);
    setIsLoadingFeedback(false);
  }, [status, currentLevel]);

  const handleStart = useCallback(() => {
    if (status === GameStatus.READY) {
      setStatus(GameStatus.PLAYING);
    }
  }, [status]);

  const resetLevel = () => {
    setResetCounter(prev => prev + 1);
    setStatus(GameStatus.READY);
    setFeedback('');
  };

  const nextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setResetCounter(0);
      setStatus(GameStatus.READY);
      setFeedback('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#5c94fc]">
      {/* Mario Style HUD */}
      <div className="w-full max-w-[420px] flex justify-between items-start mb-6 px-4 text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <div>
          <div className="text-[10px] font-pixel tracking-widest mb-1">SCORE</div>
          <div className="text-xl font-pixel">{String(currentLevelIndex * 1000).padStart(6, '0')}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-pixel tracking-widest mb-1">AUNTY</div>
          <div className="text-xl font-pixel">{currentLevel.title.split(':')[0].replace('World ', '')}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-pixel tracking-widest mb-1">TIME</div>
          <div className="text-xl font-pixel">400</div>
        </div>
      </div>

      <div className="relative rounded-[40px] overflow-hidden shadow-[0_20px_0_rgba(0,0,0,0.3)] bg-[#5c94fc] border-[12px] border-[#000] scale-90 sm:scale-100">
        <GameEngine 
          key={`${currentLevelIndex}-${resetCounter}`}
          level={currentLevel} 
          status={status}
          onLevelComplete={handleLevelComplete}
          onStart={handleStart}
        />

        {/* Victory Overlay */}
        {status === GameStatus.WON && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#fff] border-8 border-black p-8 text-center flex flex-col items-center">
              <div className="text-6xl mb-6">🚬</div>
              <h2 className="text-2xl font-pixel text-[#f83800] mb-4">LEVEL CLEAR!</h2>
              <p className="text-sm font-pixel leading-relaxed text-black mb-8 max-w-[240px]">
                {isLoadingFeedback ? "LOADING..." : feedback.toUpperCase()}
              </p>
              <button 
                onClick={currentLevelIndex === LEVELS.length - 1 ? () => setCurrentLevelIndex(0) : nextLevel}
                className="mario-btn bg-[#ffcc00] border-4 border-black text-black font-pixel text-[10px] py-4 px-8"
              >
                {currentLevelIndex === LEVELS.length - 1 ? "FINISH!" : "NEXT LEVEL"}
              </button>
            </div>
          </div>
        )}

        {/* Failure Overlay */}
        {status === GameStatus.FAILED && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#fff] border-8 border-black p-8 text-center flex flex-col items-center">
              <div className="text-6xl mb-6">🐝</div>
              <h2 className="text-2xl font-pixel text-[#5c94fc] mb-4">AUNTY DOWN!</h2>
              <p className="text-sm font-pixel leading-relaxed text-black mb-8 max-w-[240px]">
                {isLoadingFeedback ? "LOADING..." : feedback.toUpperCase()}
              </p>
              <button 
                onClick={resetLevel}
                className="mario-btn bg-[#f83800] border-4 border-black text-white font-pixel text-[10px] py-4 px-8"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-black/50 font-pixel text-[8px]">
         SAVE THE AUNTY © 2025 - LANDLADY EDITION
      </div>
    </div>
  );
};

export default App;
