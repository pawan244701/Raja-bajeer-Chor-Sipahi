import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

type Role = 'Raja' | 'Bajeer' | 'Chor' | 'Sipahi';
type CardSound = 'shuffle' | 'flip' | 'correct' | 'incorrect';

interface CardState {
    id: number;
    role: Role;
    isFlipped: boolean;
    assignedPlayer: string;
}
interface PlayerScore {
    name: string;
    score: number;
}
interface RoundRecord {
    round: number;
    scores: { [playerName: string]: number };
}

export const App = () => {
    const [step, setStep] = useState<number>(1);
    const [round, setRound] = useState<number>(1);
    const [totalRounds, setTotalRounds] = useState<number>(4);
    const [roundTimer, setRoundTimer] = useState<number>(0);
    const [correctAnswer, setCorrectAnswer] = useState<boolean>(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    const [players, setPlayers] = useState<PlayerScore[]>([
        { name: 'Player1', score: 0 },
        { name: 'Player2', score: 0 },
        { name: 'Player3', score: 0 },
        { name: 'Player4', score: 0 },
    ]);

    const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
    const [cards, setCards] = useState<CardState[]>([]);
    const [isAutoFlipped, setIsAutoFlipped] = useState<boolean>(false);
    const [, setClickedCardName] = useState<string>('');
    // getting winner or draw

    const getAudioContext = useCallback(() => {
        if (typeof window.AudioContext === 'undefined') return null;

        const audioContext = audioContextRef.current ?? new window.AudioContext();
        audioContextRef.current = audioContext;
        if (audioContext.state === 'suspended') void audioContext.resume();
        return audioContext;
    }, []);

    const playSound = useCallback((sound: CardSound) => {
        if (!isSoundEnabled) return;
        const audioContext = getAudioContext();
        if (!audioContext) return;

        const notes: Record<CardSound, number[]> = {
            shuffle: [340, 460, 580],
            flip: [520],
            correct: [523, 659, 784],
            incorrect: [330, 247],
        };
        const now = audioContext.currentTime;

        notes[sound].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const startAt = now + index * 0.09;
            const duration = sound === 'flip' ? 0.12 : 0.16;

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, startAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.07, startAt + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(startAt);
            oscillator.stop(startAt + duration);
        });
    }, [getAudioContext, isSoundEnabled]);

    const maxScore = Math.max(...players.map((p) => p.score));
    const topPlayers = players.filter((p) => p.score === maxScore);
    const isDraw = topPlayers.length > 1;

    const shuffleRoles = (): Role[] => {
        const roles: Role[] = ['Raja', 'Bajeer', 'Chor', 'Sipahi'];
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = roles[i]!;
            roles[i] = roles[j]!;
            roles[j] = temp;
        }
        return roles;
    };

    // to prepare cards before step 4 starts
    const setupNewRoundCards = useCallback(() => {
        const shuffledRoles = shuffleRoles();
        const newCards: CardState[] = shuffledRoles.map((role, index) => ({
            id: index,
            role: role,
            isFlipped: false,
            assignedPlayer: players[index]?.name || `player ${index + 1}`,
        }));
        setCards(newCards);
        setIsAutoFlipped(false);
        playSound('shuffle');
    }, [players, playSound]);

    useEffect(() => {
        if (step !== 3 && step !== 5) return;

        const timer = setInterval(() => {
            setRoundTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (step === 3) {
                        setupNewRoundCards(); // setup cards before stepping into step 4th
                        setStep(4);
                    } else if (step === 5) {
                        if (round >= totalRounds) {
                            setStep(6);
                        } else {
                            setRound(round + 1);
                            setRoundTimer(2);
                            setStep(3);
                        }
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [step, round, totalRounds, setupNewRoundCards]);

    // 3. Card Setup & Auto-Flip for Step 4 ONLY
    useEffect(() => {
        if (step !== 4) return;

        const autoFlipTimer = setTimeout(() => {
            setCards((prevCards) =>
                prevCards.map((card) =>
                    card.role === 'Raja' || card.role === 'Bajeer'
                        ? { ...card, isFlipped: true }
                        : card
                )
            );
            playSound('flip');
            setIsAutoFlipped(true);
        }, 1000);

        return () => clearTimeout(autoFlipTimer);
    }, [step, playSound]);

    const handlePlayerNameChange = (index: number, name: string) => {
        setPlayers((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index]!, name };
            return updated;
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSoundEnabled) getAudioContext();
        setStep(3);
        setRoundTimer(2);
    };

    const handleCardClick = (clickedCard: CardState) => {
        // must wait for autoflip to finish, and can't click already flipped cards
        if (!isAutoFlipped || clickedCard.isFlipped) return;

        const isGuessCorrect = clickedCard.role === 'Chor';
        playSound(isGuessCorrect ? 'correct' : 'incorrect');
        setCorrectAnswer(isGuessCorrect);
        setClickedCardName(clickedCard.assignedPlayer); // KEEPS who clicked whick card
        // Flip all remaining cards
        setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

        const currentRoundScores: { [key: string]: number } = {};

        // Update scores
        setPlayers((prevPlayers) =>
            prevPlayers.map((player) => {
                const playerCard = cards.find((c) => c.assignedPlayer === player.name);
                if (!playerCard) return player;

                let pointsEarned = 0;
                if (playerCard.role === 'Raja') pointsEarned = 1000;
                else if (playerCard.role === 'Bajeer') pointsEarned = isGuessCorrect ? 800 : 0;
                else if (playerCard.role === 'Sipahi') pointsEarned = 500;
                else if (playerCard.role === 'Chor') pointsEarned = isGuessCorrect ? 0 : 800;

                // Saveing all  individual round scores
                currentRoundScores[player.name] = pointsEarned;
                return { ...player, score: player.score + pointsEarned };
            })
        );

        // saaving round history
        setRoundHistory((prev) => [
            ...prev,
            { round: round, scores: currentRoundScores },
        ]);

        // waitign to show fliped cards
        setTimeout(() => {
            setStep(5);
            setRoundTimer(2);
        }, 2000);
    };

    const resetGameState = (targetStep: number) => {
        setRound(1);
        setRoundHistory([]);
        setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
        setRoundTimer(2);
        setStep(targetStep);
    };
    const goBack = () => resetGameState(1);
    const resetGame = () => resetGameState(3);

    const bajeerPlayer = cards.find(c => c.role === 'Bajeer')?.assignedPlayer;
    const chorPlayer = cards.find(c => c.role === 'Chor')?.assignedPlayer;
    // const chorPlayer = cards.find(c => c.role === 'Chor')?.assignedPlayer;

    // const forceDraw = () => {
    //     setPlayers((prev) => prev.map((player) => ({ ...player, score: 2000 })));
    //     setStep(6);
    // };

    const drawRound = () => {
        setStep(3);
        setRound(round + 1)
    }

    return (
        <div className="app-root min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
            {step === 1 && (
                <section className="game-panel bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
                    <h1 className="text-3xl font-extrabold tracking-tight text-amber-400">Raja-Mantri-Chor-Sipahi</h1>
                    <h2 className="text-lg font-medium text-slate-300">It is a four player game.</h2>
                    <p className="text-sm text-slate-400 text-left bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 leading-relaxed">
                        <strong className="text-amber-300 block mb-2 text-base">All steps:</strong>
                        <br /> 1: Click Start
                        <br /> 2: Enter all players names
                        <br /> 3: Select number of rounds you want to play (10 to 100)
                        <br /> 4: Click play
                        <br /> 5: Guess who got Chor card!
                    </p>
                    <h2 className="text-sm font-semibold text-emerald-400">At the end you will see your final score.</h2>
                    <button

                        className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                        type="button" onClick={() => setStep(2)}>
                        Start
                    </button>
                </section>
            )}

            {step === 2 && (
                <div className="game-panel bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl">
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {players.map((p, index) => (
                            <label key={index} className="block text-sm font-medium text-slate-300 space-y-1">
                                Player {index + 1} Name:
                                <input
                                    type="text"
                                    required
                                    value={p.name}
                                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                                    className="w-full mt-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                                />
                            </label>
                        ))}
                        <div className="pt-2">
                            <select
                                value={totalRounds}
                                onChange={(e) => setTotalRounds(Number(e.target.value))}
                                required
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition cursor-pointer"
                            >
                                <option value="">----Select Rounds----</option>
                                <option value="5">05 rounds</option>
                                <option value="10">10 rounds</option>
                                <option value="20">20 rounds</option>
                                <option value="30">30 rounds</option>
                                <option value="40">40 rounds</option>
                                <option value="50">50 rounds</option>
                            </select>
                        </div>
                        <button
                            className="w-full mt-6 py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                            type="submit">Play</button>
                    </form>
                </div>
            )}

            {step === 3 && (
                <div className="game-panel shuffle-panel bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
                    <h2 className="text-xl font-bold text-amber-400">Round: {round} / {totalRounds}</h2>
                    <p className="text-slate-300 font-medium">Shuffling cards...</p>
                    <div className="shuffle-deck" aria-hidden="true"><span>♠</span><span>◆</span><span>♣</span></div>
                    <h1 className="text-6xl font-black text-emerald-400">{roundTimer}</h1>
                </div>
            )}

            {step === 4 && (
                <section className="game-panel card-game-panel bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl text-center space-y-5 sm:space-y-6">
                    <div className="card-game-header">
                        <div>
                            <p className="eyebrow">Round {round} of {totalRounds}</p>
                            <h2 className="text-2xl font-extrabold text-amber-400">Choose your card</h2>
                        </div>
                        <button
                            className="sound-toggle"
                            type="button"
                            aria-pressed={isSoundEnabled}
                            onClick={() => {
                                if (!isSoundEnabled) getAudioContext();
                                setIsSoundEnabled((enabled) => !enabled);
                            }}
                        >
                            <span aria-hidden="true">{isSoundEnabled ? '♫' : '♪'}</span>
                            Sound {isSoundEnabled ? 'on' : 'off'}
                        </button>
                    </div>
                    <p className="card-prompt" aria-live="polite">
                        {isAutoFlipped
                            ? 'The Raja and Bajeer are revealed. Tap a hidden card to guess the Chor.'
                            : 'Revealing Raja and Bajeer...'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                        {cards.map((card) => (
                            <button
                                key={card.id}
                                className={`game-card${card.isFlipped ? ' is-flipped' : ''}`}
                                data-role={card.isFlipped ? card.role : undefined}
                                style={{ animationDelay: `${card.id * 80}ms` }}
                                onClick={() => handleCardClick(card)}
                                disabled={!isAutoFlipped || card.isFlipped}
                                aria-label={`${card.assignedPlayer}'s ${card.isFlipped ? card.role : 'hidden'} card`}
                                aria-pressed={card.isFlipped}
                            >
                                <span className="game-card-inner">
                                    <span className="game-card-face game-card-back">
                                        <span className="card-player-name">{card.assignedPlayer}</span>
                                        <span className="card-back-mark" aria-hidden="true">?</span>
                                        <span className="card-hint">{isAutoFlipped ? 'Tap to reveal' : 'Shuffling'}</span>
                                    </span>
                                    <span className="game-card-face game-card-front">
                                        <span className="card-player-name">{card.assignedPlayer}</span>
                                        <span className="card-role-mark" aria-hidden="true">
                                            {card.role === 'Raja' ? '♛' : card.role === 'Bajeer' ? '✦' : card.role === 'Sipahi' ? '♜' : '♠'}
                                        </span>
                                        <span className="card-role-name">{card.role}</span>
                                        <span className="card-hint">Revealed</span>
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="card-footnote">Choose carefully - the hidden card will be revealed.</p>
                </section>
            )}
            {step === 5 && (
                <div className={`game-panel result-panel ${correctAnswer ? 'result-correct' : 'result-incorrect'} bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6`}>
                    <h2>
                        {correctAnswer
                            ? <p><strong className='text-emerald-400'>Correct!</strong><br /><strong className='text-emerald-400'>{bajeerPlayer}</strong> you cought <strong className='text-red-400'>{chorPlayer}</strong></p>
                            : <p><strong className='text-red-500'>Opps!</strong><br /><strong className='text-red-400'>{chorPlayer}</strong> escaped and <strong className='text-amber-400'>{bajeerPlayer}</strong> you lost your <strong className='text-red-600'>800</strong> points!</p>
                        }
                    </h2>
                    <p className="text-sm text-slate-400">Next round starting in...</p>
                    <h1 className="text-5xl font-black text-amber-400">{roundTimer}</h1>
                </div>
            )}

            {step === 6 && (
                <div className="game-panel bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl text-center">
                    {!isDraw ? (
                        <div className="space-y-6">
                            <h2 className="text-sm uppercase tracking-widest text-emerald-400 font-bold">Winner!</h2>
                            <p className="text-2xl font-extrabold text-amber-400 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                                <span className='text-emerald-400'
                                >{topPlayers[0]?.name} </span>
                                with the score of
                                <span className='text-emerald-400'
                                > {topPlayers[0]?.score}</span>
                            </p>

                            <button
                                className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                                type="button" onClick={() => setStep(7)}>
                                View Scoreboard
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-extrabold text-amber-400">It's a Draw!</h2>
                            <p className="text-sm text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                                Tied players: {topPlayers.map((p) => p.name).join(', ')}
                            </p>
                            <button
                                className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                                type="button" onClick={drawRound}>
                                Play 1 more round
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 7 && (
                <div className="game-panel bg-slate-800 border border-slate-700 rounded-2xl p-5 sm:p-8 max-w-xl w-full shadow-2xl space-y-6">
                    <h2 className="text-2xl font-extrabold text-amber-400 text-center">Final Score-board</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-slate-300 text-sm border-b border-slate-700">
                                    {players.map((p, i) => (
                                        <th key={i} className="p-3 text-center font-bold border-r border-slate-800 last:border-r-0">{p.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
                                {roundHistory.map((record) => (
                                    <tr key={record.round}
                                        className="hover:bg-slate-700/30 transition"
                                    >
                                        {players.map((p, i) => (
                                            <td key={i}
                                                className="p-3 text-center border-r border-slate-700/30 last:border-r-0"
                                            >{record.scores[p.name] ?? 0}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900/80 text-amber-400 font-bold border-t-2 border-slate-700">
                                    {players.map((p, i) => (
                                        <td key={i} className="p-3 text-center border-r border-slate-800 last:border-r-0"
                                        ><strong>{p.score}</strong></td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                    <div className="flex gap-4 pt-2">
                        <button
                            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                            type="button" onClick={resetGame}>
                            Play Again
                        </button>
                        <button
                            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                            type="button" onClick={goBack}>
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
