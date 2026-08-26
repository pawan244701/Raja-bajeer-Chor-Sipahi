import { useState, useEffect } from 'react';
import './App.css';

type Role = 'Raja' | 'Bajeer' | 'Chor' | 'Sipahi';

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
    const setupNewRoundCards = () => {
        const shuffledRoles = shuffleRoles();
        const newCards: CardState[] = shuffledRoles.map((role, index) => ({
            id: index,
            role: role,
            isFlipped: false,
            assignedPlayer: players[index]?.name || `player ${index + 1}`,
        }));
        setCards(newCards);
        setIsAutoFlipped(false);
    };

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
    }, [step]);

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
            setIsAutoFlipped(true);
        }, 1000);

        return () => clearTimeout(autoFlipTimer);
    }, [step]);

    const handlePlayerNameChange = (index: number, name: string) => {
        setPlayers((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index]!, name };
            return updated;
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(3);
        setRoundTimer(2);
    };

    const handleCardClick = (clickedCard: CardState) => {
        // must wait for autoflip to finish, and can't click already flipped cards
        if (!isAutoFlipped || clickedCard.isFlipped) return;

        const isGuessCorrect = clickedCard.role === 'Chor';
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
        <div className="">
            {step === 1 && (
                <section className="">
                    <h1>Raja-Mantri-Chor-Sipahi</h1>
                    <h2>It is a four player game.</h2>
                    <p className="">
                        <strong>All steps:</strong>
                        <br /> 1: Click Start
                        <br /> 2: Enter all players names
                        <br /> 3: Select number of rounds you want to play (10 to 100)
                        <br /> 4: Click play
                        <br /> 5: Guess who got Chor card!
                    </p>
                    <h2>At the end you will see your final score.</h2>
                    <button className=""
                        type="button" onClick={() => setStep(2)}>
                        Start
                    </button>
                </section>
            )}

            {step === 2 && (
                <div className="">
                    <form onSubmit={handleFormSubmit}>
                        {players.map((p, index) => (
                            <label key={index}>
                                Player {index + 1} Name:
                                <input
                                    type="text"
                                    required
                                    value={p.name}
                                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                                />
                            </label>
                        ))}

                        <select
                            value={totalRounds}
                            onChange={(e) => setTotalRounds(Number(e.target.value))}
                            required
                        >
                            <option value="">----Select Rounds----</option>
                            <option value="5">05 rounds</option>
                            <option value="10">10 rounds</option>
                            <option value="20">20 rounds</option>
                            <option value="30">30 rounds</option>
                            <option value="40">40 rounds</option>
                            <option value="50">50 rounds</option>
                        </select>

                        <button className=""
                            type="submit">Play</button>
                    </form>
                </div>
            )}

            {step === 3 && (
                <div className="">
                    <h2>Round: {round} / {totalRounds}</h2>
                    <p>Shuffling cards...</p>
                    <h1>{roundTimer}</h1>
                </div>
            )}

            {step === 4 && (
                <section className="">
                    <h2>Round {round}</h2>
                    <h3>
                        {isAutoFlipped
                            ? 'pick a hidden card to guess the Chor!'
                            : 'Revealing Raja and Bajeer...'}
                    </h3>

                    <div className="">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className=""
                                onClick={() => handleCardClick(card)}
                            >
                                <p><strong>{card.assignedPlayer}</strong></p>
                                <div>
                                    {card.isFlipped ? <h3>{card.role}</h3> : <h3>? (Hidden)</h3>}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* <button className={styles['all-btn']}
                        type="button" onClick={forceDraw}>
                        Force Draw
                    </button> */}
                </section>
            )}

            {step === 5 && (
                <div className="">
                    <h2>
                        {correctAnswer
                            ? `Correct! ${bajeerPlayer} you won the round!`
                            : `Opps, Wrong! chor escaped and ${bajeerPlayer} you lost your points!`}
                    </h2>
                    <p>Next round starting in...</p>
                    <h1>{roundTimer}</h1>
                </div>
            )}

            {step === 6 && (
                <div className="">
                    {!isDraw ? (
                        <div>
                            <h2>Winner!</h2>
                            <h1>{topPlayers[0]?.name} with a score of {topPlayers[0]?.score}</h1>

                            <button className=""
                                type="button" onClick={() => setStep(7)}>
                                View Scoreboard
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2>It's a Draw!</h2>
                            <p>Tied players: {topPlayers.map((p) => p.name).join(', ')}</p>

                            <button className=""
                                type="button" onClick={drawRound}>
                                Play 1 more round
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 7 && (
                <div className="">
                    <h2>Final Score-board</h2>
                    <table>
                        <thead>
                            <tr>
                                {players.map((p, i) => (
                                    <th key={i}>{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roundHistory.map((record) => (
                                <tr key={record.round}>
                                    {players.map((p, i) => (
                                        <td key={i}>{record.scores[p.name] ?? 0}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {players.map((p, i) => (
                                    <td key={i}><strong>{p.score}</strong></td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                    <div>
                        <button className=""
                            type="button" onClick={resetGame}>
                            Play Again
                        </button>
                        <button className=""
                            type="button" onClick={goBack}>
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
