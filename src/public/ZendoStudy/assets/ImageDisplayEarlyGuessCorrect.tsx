import React, { useState, useEffect } from 'react';
import { getEmbedding, loadRuleEmbeddings, cosineSimilarity } from '../../../utils/embeddingUtils';

type ImageDisplayParams = {
  parameters: {
    imgOptions?: string[];
    instructions: string;
    timerSeconds?: number;
    ruleKey?: string;
  };
  setAnswer: (args: {
    status: boolean;
    provenanceGraph?: unknown;
    answers: Record<string, string>;
  }) => void;
};

function ImageDisplay({ parameters, setAnswer }: ImageDisplayParams) {
  const {
    imgOptions = [],
    instructions,
    timerSeconds = 0,
    ruleKey,
  } = parameters;

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds);
  const [guess, setGuess] = useState<string>('');
  const [showReminder, setShowReminder] = useState<boolean>(false);
  const [canGuessEarly, setCanGuessEarly] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [guessFeedback, setGuessFeedback] = useState<string>('');

  useEffect(() => {
    if (imgOptions && imgOptions.length > 0) {
      setSelectedImage(import.meta.env.BASE_URL + imgOptions[0]);
    }
    setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
  }, [imgOptions, setAnswer]);

  useEffect(() => {
    if (timerSeconds <= 0 || timeLeft <= 0) {
      return undefined; // explicitly return undefined for consistency
    }

    if (!showReminder && (timeLeft === timerSeconds - 90 || timeLeft === timerSeconds - 30)) {
      setShowReminder(true);
    }

    if (!canGuessEarly && timeLeft === timerSeconds - 60) {
      setCanGuessEarly(true);
    }

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, timerSeconds, showReminder, canGuessEarly]);

  const expired = timerSeconds <= 0 || timeLeft <= 0;

  useEffect(() => {
    if (expired) {
      if (guessSubmitted) {
        setGuess('');
        setGuessSubmitted(false);
      }

      setAnswer({
        status: guess.trim().length > 0,
        provenanceGraph: undefined,
        answers: guess.trim().length > 0 ? { guess: guess.trim() } : {},
      });
    } else {
      setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
    }
  }, [expired, guess, guessSubmitted, setAnswer]);

  const handleGuessChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGuess(e.target.value);
  };

  const handleEarlySubmit = async () => {
    if (!guess.trim() || !ruleKey) return;
    setGuessSubmitted(true);

    try {
      const embedding = await getEmbedding(guess.trim());
      const ruleEmbeddings = await loadRuleEmbeddings();
      const rule = ruleEmbeddings[ruleKey];

      if (!rule) throw new Error(`Rule "${ruleKey}" not found.`);

      const similarities = await Promise.all(
        rule.embeddings.map((correctEmbedding) => cosineSimilarity(embedding, correctEmbedding)),
      );

      const maxSim = Math.max(...similarities);
      const isCorrect = maxSim >= 0.85;

      setAnswer({
        status: isCorrect,
        provenanceGraph: undefined,
        answers: {
          guess: guess.trim(),
          similarity: maxSim.toFixed(4),
          submittedEarly: 'true',
        },
      });

      setGuessFeedback(
        isCorrect
          ? 'You have guessed correctly! You can now press the Next button to move on to the next task'
          : 'Not quite right. Keep thinking aloud to find other possible guesses until the timer ends or until you are confident in your answer.',
      );
    } catch (err) {
      console.error('Embedding check failed:', err);
      setGuessFeedback('Error processing your guess. Please try again.');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <p style={{ fontSize: 18, marginBottom: 20 }}>{instructions}</p>

      {selectedImage && (
        <img
          src={selectedImage}
          alt="Display"
          style={{ maxWidth: '60%', marginBottom: 20, border: '1px solid #ccc' }}
        />
      )}

      <p style={{ color: 'black' }}>
        Remember to refer to each panel by its label (A - F) as you reason through the task.
      </p>

      {showReminder && !expired && (
        <div
          style={{
            margin: '20px auto',
            padding: '10px',
            border: '1px solid #ccc',
            width: '60%',
            backgroundColor: '#fff8dc',
          }}
        >
          <strong>Reminder:</strong>
          {' '}
          Please remember to speak your thoughts out loud as you work through the task.
        </div>
      )}

      {timerSeconds > 0 && !expired && (
        <div style={{ fontSize: 16, marginBottom: 20 }}>
          Time Remaining:
          {' '}
          {formatTime(timeLeft)}
        </div>
      )}

      {canGuessEarly && !expired && !guessSubmitted && (
        <div>
          <p><strong>You can now submit one early guess:</strong></p>
          <textarea
            value={guess}
            onChange={handleGuessChange}
            placeholder="Enter your rule guess"
            style={{ width: '60%', height: 80 }}
          />
          <br />
          <button type="button" onClick={handleEarlySubmit} style={{ marginTop: 10 }}>
            Submit Early Guess
          </button>
        </div>
      )}

      {guessSubmitted && !expired && (
        <p style={{ marginTop: 10, fontStyle: 'italic' }}>{guessFeedback}</p>
      )}

      {expired && (
        <div>
          <p><strong>What do you think the hidden rule is?</strong></p>
          <p className="text-sm text-gray-700 mb-2">
            You can enter more than one rule. Rank them from most confident to least confident.
          </p>
          <textarea
            value={guess}
            onChange={handleGuessChange}
            placeholder={'Type your rule guess or guesses here.\nStart with your most likely guess. Include others if you are unsure.'}
            style={{ width: '60%', height: 100, marginTop: 10 }}
          />
        </div>
      )}
    </div>
  );
}

export default ImageDisplay;
