import React, { useState, useEffect } from 'react';

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
  } = parameters;

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds);
  const [guess, setGuess] = useState<string>('');
  const [canGuessEarly, setCanGuessEarly] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [guessFeedback, setGuessFeedback] = useState<string>('');
  const [showReminder30, setShowReminder30] = useState(false);
  const [showProbe130, setShowProbe130] = useState(false);

  useEffect(() => {
    if (imgOptions.length > 0) {
      setSelectedImage(import.meta.env.BASE_URL + imgOptions[0]);
    }

    setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
  }, []);

  useEffect(() => {
    if (timerSeconds <= 0 || timeLeft <= 0) {
      return undefined;
    }

    if (!showReminder30 && timeLeft === timerSeconds - 30) {
      setShowReminder30(true);
    }

    if (!canGuessEarly && timeLeft === timerSeconds - 60) {
      setCanGuessEarly(true);
      setShowReminder30(false);
    }

    if (!showProbe130 && timeLeft === timerSeconds - 90) {
      setShowProbe130(true);
      setCanGuessEarly(false);
    }

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, timerSeconds, showReminder30, canGuessEarly, showProbe130]);

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

  const handleEarlySubmit = () => {
    if (!guess.trim()) return;
    setGuessSubmitted(true);

    setAnswer({
      status: false,
      provenanceGraph: undefined,
      answers: {
        guess: guess.trim(),
        submittedEarly: 'true',
      },
    });

    setGuessFeedback(
      'Thank you for your guess! Now keep thinking aloud. You might want to test your idea, consider exceptions, or explore alternative possibilities.',
    );
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

      {showReminder30 && !expired && (
        <div style={{
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
          <p><strong>Optional: If you have a strong idea about the rule, you may enter an early guess now.</strong></p>
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

      {showProbe130 && !expired && (
        <div style={{
          margin: '20px auto',
          padding: '10px',
          border: '1px solid #ccc',
          width: '60%',
          backgroundColor: '#fff8dc',
        }}
        >
          {guessSubmitted ? (
            <p>
              <strong>Keep going:</strong>
              {' '}
              Take this time to evaluate whether your guess holds, look for counterexamples, or explore other possible rules.
            </p>
          ) : (
            <p>
              You are doing great! Keep thinking aloud, try to generate new ideas or re-examine the panels from a different angle.
            </p>
          )}
        </div>
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
