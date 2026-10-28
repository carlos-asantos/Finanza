/**
 * Identical Copy of Flappy Bird - Secret Easter Egg Mini-Game
 * Authentic physics, pixel-art aesthetic, parallax scenery, sound synthesis, and high scores.
 * Supports Portuguese and English language interfaces.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import { SoundEngine } from '../../utils/soundEffects';
import { FinanzaService } from '../../services/storage';
import { Language, translations } from '../../utils/i18n';
import confetti from 'canvas-confetti';

interface FlappyBirdGameProps {
  profileId: string;
  lang: Language;
  onClose: () => void;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

const CANVAS_WIDTH = 288;
const CANVAS_HEIGHT = 512;
const GROUND_HEIGHT = 100;
const PIPE_WIDTH = 52;
const PIPE_GAP = 110;
const GRAVITY = 0.38;
const JUMP_FORCE = -6.8;
const PIPE_SPEED = 2.1;

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ profileId, lang, onClose }) => {
  const t = translations[lang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [muted, setMuted] = useState(SoundEngine.isMuted());
  const [newBest, setNewBest] = useState(false);

  // References for continuous 60fps loop
  const birdRef = useRef({
    x: 68,
    y: 210,
    velocity: 0,
    radius: 12,
    rotation: 0,
    wingFrame: 0,
    wingTimer: 0
  });

  const pipesRef = useRef<Pipe[]>([]);
  const groundOffsetRef = useRef(0);
  const cloudOffsetRef = useRef(0);
  const cityOffsetRef = useRef(0);
  const scoreRef = useRef(0);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');

  // Load high score
  useEffect(() => {
    FinanzaService.getHighScores(profileId).then(scores => {
      if (scores.length > 0) {
        setBestScore(scores[0].score);
      }
    });
  }, [profileId]);

  // Keep state ref in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Flap action
  const flap = useCallback(() => {
    if (gameStateRef.current === 'IDLE') {
      gameStateRef.current = 'PLAYING';
      setGameState('PLAYING');
      birdRef.current.velocity = JUMP_FORCE;
      SoundEngine.playFlap();
      return;
    }

    if (gameStateRef.current === 'PLAYING') {
      birdRef.current.velocity = JUMP_FORCE;
      SoundEngine.playFlap();
    }
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    birdRef.current = {
      x: 68,
      y: 210,
      velocity: 0,
      radius: 12,
      rotation: 0,
      wingFrame: 0,
      wingTimer: 0
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setNewBest(false);
    gameStateRef.current = 'IDLE';
    setGameState('IDLE');
    SoundEngine.playSwoosh();
  }, []);

  // Handle Game Over
  const triggerGameOver = useCallback((currentScore: number) => {
    gameStateRef.current = 'GAMEOVER';
    setGameState('GAMEOVER');
    SoundEngine.playHit();
    setTimeout(() => SoundEngine.playDie(), 120);

    FinanzaService.recordGameScore(profileId, currentScore, currentScore);

    if (currentScore > bestScore) {
      setBestScore(currentScore);
      setNewBest(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [profileId, bestScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameStateRef.current === 'GAMEOVER') {
          resetGame();
        } else {
          flap();
        }
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap, resetGame, onClose]);

  // Main Canvas Render & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;

      // UPDATE LOGIC
      if (gameStateRef.current === 'IDLE') {
        birdRef.current.y = 210 + Math.sin(timestamp / 240) * 8;
        birdRef.current.rotation = 0;
        birdRef.current.wingTimer++;
        if (birdRef.current.wingTimer % 6 === 0) {
          birdRef.current.wingFrame = (birdRef.current.wingFrame + 1) % 3;
        }

        groundOffsetRef.current = (groundOffsetRef.current + PIPE_SPEED) % 18;
        cloudOffsetRef.current = (cloudOffsetRef.current + 0.4) % CANVAS_WIDTH;
        cityOffsetRef.current = (cityOffsetRef.current + 0.8) % CANVAS_WIDTH;
      } else if (gameStateRef.current === 'PLAYING') {
        birdRef.current.velocity += GRAVITY;
        birdRef.current.y += birdRef.current.velocity;

        if (birdRef.current.velocity < 0) {
          birdRef.current.rotation = Math.max(-0.45, birdRef.current.rotation - 0.1);
        } else {
          birdRef.current.rotation = Math.min(1.2, birdRef.current.rotation + 0.045);
        }

        birdRef.current.wingTimer++;
        if (birdRef.current.wingTimer % 4 === 0) {
          birdRef.current.wingFrame = (birdRef.current.wingFrame + 1) % 3;
        }

        groundOffsetRef.current = (groundOffsetRef.current + PIPE_SPEED) % 18;
        cloudOffsetRef.current = (cloudOffsetRef.current + 0.4) % CANVAS_WIDTH;
        cityOffsetRef.current = (cityOffsetRef.current + 0.8) % CANVAS_WIDTH;

        const lastPipe = pipesRef.current[pipesRef.current.length - 1];
        if (!lastPipe || lastPipe.x < CANVAS_WIDTH - 150) {
          const minHeight = 50;
          const maxHeight = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - minHeight;
          const topHeight = Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
          const bottomHeight = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - topHeight;

          pipesRef.current.push({
            x: CANVAS_WIDTH + 10,
            topHeight,
            bottomHeight,
            passed: false,
          });
        }

        const birdX = birdRef.current.x;
        const birdY = birdRef.current.y;
        const birdRadius = birdRef.current.radius - 2;

        if (birdY + birdRadius >= CANVAS_HEIGHT - GROUND_HEIGHT) {
          birdRef.current.y = CANVAS_HEIGHT - GROUND_HEIGHT - birdRadius;
          triggerGameOver(scoreRef.current);
        } else if (birdY - birdRadius <= 0) {
          birdRef.current.y = birdRadius;
          birdRef.current.velocity = 0;
        }

        for (let i = 0; i < pipesRef.current.length; i++) {
          const pipe = pipesRef.current[i];
          pipe.x -= PIPE_SPEED;

          if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            SoundEngine.playScore();
          }

          const withinX = birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + PIPE_WIDTH;
          const hitTopPipe = birdY - birdRadius < pipe.topHeight;
          const hitBottomPipe = birdY + birdRadius > CANVAS_HEIGHT - GROUND_HEIGHT - pipe.bottomHeight;

          if (withinX && (hitTopPipe || hitBottomPipe)) {
            triggerGameOver(scoreRef.current);
            break;
          }
        }

        pipesRef.current = pipesRef.current.filter(p => p.x + PIPE_WIDTH > -20);
      } else if (gameStateRef.current === 'GAMEOVER') {
        if (birdRef.current.y + birdRef.current.radius < CANVAS_HEIGHT - GROUND_HEIGHT) {
          birdRef.current.velocity += GRAVITY * 1.5;
          birdRef.current.y += birdRef.current.velocity;
          birdRef.current.rotation = Math.min(1.4, birdRef.current.rotation + 0.1);
        }
      }

      // DRAW LOGIC
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
      skyGrad.addColorStop(0, '#4ec0ca');
      skyGrad.addColorStop(1, '#81d4db');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Skyline
      ctx.fillStyle = '#67c4be';
      for (let i = -1; i < 4; i++) {
        const cx = i * 110 - (cityOffsetRef.current * 0.4);
        ctx.fillRect(cx, CANVAS_HEIGHT - GROUND_HEIGHT - 60, 40, 60);
        ctx.fillRect(cx + 42, CANVAS_HEIGHT - GROUND_HEIGHT - 45, 30, 45);
        ctx.fillRect(cx + 74, CANVAS_HEIGHT - GROUND_HEIGHT - 75, 32, 75);
      }

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = -1; i < 3; i++) {
        const clX = i * 160 - cloudOffsetRef.current;
        ctx.beginPath();
        ctx.arc(clX + 30, 110, 18, 0, Math.PI * 2);
        ctx.arc(clX + 50, 104, 24, 0, Math.PI * 2);
        ctx.arc(clX + 75, 110, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pipes
      for (const pipe of pipesRef.current) {
        drawPipe(ctx, pipe.x, 0, pipe.topHeight, true);
        drawPipe(ctx, pipe.x, CANVAS_HEIGHT - GROUND_HEIGHT - pipe.bottomHeight, pipe.bottomHeight, false);
      }

      // Scrolling Ground
      drawGround(ctx, groundOffsetRef.current);

      // Flappy Bird
      drawBird(ctx, birdRef.current);

      // Score in game
      if (gameStateRef.current === 'PLAYING') {
        drawScore(ctx, scoreRef.current);
      }

      animFrameId.current = requestAnimationFrame(gameLoop);
    };

    animFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [triggerGameOver]);

  const drawGround = (ctx: CanvasRenderingContext2D, offset: number) => {
    const y = CANVAS_HEIGHT - GROUND_HEIGHT;
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, y, CANVAS_WIDTH, GROUND_HEIGHT);

    ctx.fillStyle = '#cfc57a';
    ctx.fillRect(0, y + 14, CANVAS_WIDTH, GROUND_HEIGHT - 14);

    ctx.fillStyle = '#73be2e';
    ctx.fillRect(0, y, CANVAS_WIDTH, 12);

    ctx.fillStyle = '#558022';
    ctx.fillRect(0, y + 12, CANVAS_WIDTH, 2);

    ctx.fillStyle = '#c5ba6d';
    for (let x = -offset; x < CANVAS_WIDTH + 20; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 8, y + 14);
      ctx.lineTo(x, y + 24);
      ctx.fill();
    }
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, isTop: boolean) => {
    const capHeight = 24;
    const capExtraWidth = 4;

    ctx.save();
    const bodyGrad = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
    bodyGrad.addColorStop(0, '#558022');
    bodyGrad.addColorStop(0.12, '#73be2e');
    bodyGrad.addColorStop(0.3, '#9ce659');
    bodyGrad.addColorStop(0.7, '#73be2e');
    bodyGrad.addColorStop(1, '#558022');

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x, isTop ? 0 : y + capHeight, PIPE_WIDTH, height - capHeight);

    ctx.strokeStyle = '#2d4512';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, isTop ? 0 : y + capHeight, PIPE_WIDTH, height - capHeight);

    const capX = x - capExtraWidth / 2;
    const capY = isTop ? y + height - capHeight : y;
    const capWidth = PIPE_WIDTH + capExtraWidth;

    const capGrad = ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
    capGrad.addColorStop(0, '#558022');
    capGrad.addColorStop(0.12, '#73be2e');
    capGrad.addColorStop(0.35, '#a4f060');
    capGrad.addColorStop(0.75, '#73be2e');
    capGrad.addColorStop(1, '#2d4512');

    ctx.fillStyle = capGrad;
    ctx.fillRect(capX, capY, capWidth, capHeight);
    ctx.strokeRect(capX, capY, capWidth, capHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x + 8, isTop ? 0 : y, 4, height);
    ctx.restore();
  };

  const drawBird = (
    ctx: CanvasRenderingContext2D,
    bird: { x: number; y: number; rotation: number; wingFrame: number }
  ) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f8e71c';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222';
    ctx.stroke();

    // Belly
    ctx.beginPath();
    ctx.ellipse(-3, 3, 9, 6, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(6, -5, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(7.5, -6.5, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(19, 0);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fillStyle = '#f56522';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.lineTo(18, 0);
    ctx.strokeStyle = '#222';
    ctx.stroke();

    // Animated Wing
    ctx.beginPath();
    if (bird.wingFrame === 0) {
      ctx.ellipse(-7, -4, 8, 4.5, -0.4, 0, Math.PI * 2);
    } else if (bird.wingFrame === 1) {
      ctx.ellipse(-7, 0, 7.5, 5, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-6, 4, 8, 4.5, 0.4, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const drawScore = (ctx: CanvasRenderingContext2D, currentScore: number) => {
    ctx.save();
    ctx.font = '900 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(currentScore.toString(), CANVAS_WIDTH / 2, 70);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(currentScore.toString(), CANVAS_WIDTH / 2, 70);
    ctx.restore();
  };

  const toggleSound = () => {
    const isNowMuted = !SoundEngine.toggleSound();
    setMuted(isNowMuted);
  };

  const getMedalColor = (s: number) => {
    if (s >= 40) return { name: 'Platina / Platinum', color: 'from-cyan-200 to-blue-400', border: 'border-cyan-300' };
    if (s >= 25) return { name: 'Ouro / Gold', color: 'from-amber-200 to-yellow-500', border: 'border-amber-400' };
    if (s >= 15) return { name: 'Prata / Silver', color: 'from-slate-200 to-slate-400', border: 'border-slate-300' };
    if (s >= 5) return { name: 'Bronze', color: 'from-amber-600 to-amber-800', border: 'border-amber-700' };
    return null;
  };

  const medal = getMedalColor(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col items-center max-w-sm w-full select-none overflow-hidden">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-1.5">
              {t.arcadeTitle} <span className="text-xs text-amber-400 font-normal">· {t.arcadeBadge}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title={muted ? t.unmute : t.mute}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div
          className="relative rounded-xl overflow-hidden shadow-inner border-2 border-slate-700 cursor-pointer"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onClick={() => {
            if (gameState === 'GAMEOVER') resetGame();
            else flap();
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
          />

          {/* IDLE Overlay: Get Ready */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-slate-950/70 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/20 text-center animate-bounce">
                <p className="text-amber-300 font-extrabold text-lg tracking-wider drop-shadow-md">{t.getReady}</p>
                <p className="text-xs text-slate-200 mt-1 font-medium">{t.tapToFlap}</p>
              </div>

              {bestScore > 0 && (
                <div className="mt-8 bg-slate-900/80 px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.profileBest} {bestScore}</span>
                </div>
              )}
            </div>
          )}

          {/* GAMEOVER Overlay: Authentic Scoreboard Modal */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in zoom-in-95 duration-150">
              {/* Scoreboard Card */}
              <div className="w-64 bg-amber-50 border-4 border-amber-800 rounded-xl p-4 shadow-2xl text-slate-900">
                <div className="text-center font-extrabold text-amber-900 text-xl tracking-tight mb-2">
                  {t.gameOver}
                </div>

                <div className="flex items-center justify-between gap-3 bg-amber-100/90 rounded-lg p-3 border border-amber-300 mb-3">
                  {/* Medal Slot */}
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-amber-600 bg-white shadow-inner">
                    {medal ? (
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${medal.color} border ${medal.border} flex items-center justify-center shadow`}>
                          <Sparkles className="w-4 h-4 text-white drop-shadow" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 mt-0.5 text-center leading-tight">
                          {medal.name.split('/')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 text-center px-1">
                        {t.noMedal}
                      </span>
                    )}
                  </div>

                  {/* Numbers */}
                  <div className="flex-1 flex flex-col items-end space-y-1">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">{t.score}</span>
                      <p className="font-mono text-2xl font-extrabold text-slate-900 leading-none">{score}</p>
                    </div>

                    <div className="text-right pt-1 border-t border-amber-300/80 w-full">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-end gap-1">
                        {newBest && <span className="text-rose-600 font-black animate-pulse">{t.newRecord}</span>}
                        {t.best}
                      </span>
                      <p className="font-mono text-xl font-bold text-amber-900 leading-none">{bestScore}</p>
                    </div>
                  </div>
                </div>

                {/* Restart CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t.playAgain}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="w-full mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>{t.controlsHint}</span>
        </div>
      </div>
    </div>
  );
};
