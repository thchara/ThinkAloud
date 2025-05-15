import React, { useState, useEffect } from 'react';

type ImageDisplayParams = {
  parameters: {
    imgOptions?: string[]; // Used for a single, fixed image
    instructions: string;
    timerSeconds?: number;
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
  const [showReminder, setShowReminder] = useState<boolean>(false);

  // Load fixed image
  useEffect(() => {
    if (imgOptions.length === 1) {
      setSelectedImage(import.meta.env.BASE_URL + imgOptions[0]);
    }
  }, [imgOptions]);

  // Initialize answer on mount
  useEffect(() => {
    setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
  }, [setAnswer]);

  // Countdown logic
  useEffect(() => {
    const shouldRunTimer = timerSeconds > 0 && timeLeft > 0;

    if (!shouldRunTimer) return () => {};

    if (!showReminder && timeLeft === Math.floor(timerSeconds / 2)) {
      setShowReminder(true);
    }

    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [timeLeft, timerSeconds, showReminder]);

  const expired = timerSeconds <= 0 || timeLeft <= 0;

  // Enable Next button when expired and guess is filled
  useEffect(() => {
    if (expired && guess.trim().length > 0) {
      setAnswer({
        status: true,
        provenanceGraph: undefined,
        answers: { guess: guess.trim() },
      });
    } else {
      setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
    }
  }, [expired, guess, setAnswer]);

  const handleGuessChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGuess(e.target.value);
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

      {expired && (
        <div>
          <p><strong>What do you think the hidden rule is?</strong></p>
          <p className="text-sm text-gray-700 mb-2">
            You can enter more than one rule. Rank them from most confident to least confident.
          </p>
          <textarea
            value={guess}
            onChange={handleGuessChange}
            placeholder={
              'Type your rule guess or guesses here.\nStart with your most likely guess. Include others if you are unsure.'
            }
            style={{ width: '60%', height: 100, marginTop: 10 }}
          />
        </div>
      )}
    </div>
  );
}

export default ImageDisplay;
