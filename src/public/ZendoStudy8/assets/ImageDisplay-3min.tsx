import React, { useState, useEffect } from 'react';

type ImageDisplayParams = {
  parameters: {
    imgOptions?: string[]; // images to randomize
    exampleImgOptions?: string[]; // single example image, not randomized
    instructions: string;
    timerSeconds?: number; // seconds for countdown; omit or 0 to skip
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
    exampleImgOptions,
    instructions,
    timerSeconds = 0,
  } = parameters;

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds);
  const [guess, setGuess] = useState<string>('');
  const [showReminder, setShowReminder] = useState<boolean>(false);
  const [allowGuess, setAllowGuess] = useState<boolean>(false);

  useEffect(() => {
    if (exampleImgOptions && exampleImgOptions.length === 1) {
      setSelectedImage(import.meta.env.BASE_URL + exampleImgOptions[0]);
    } else if (imgOptions.length > 0) {
      const idx = Math.floor(Math.random() * imgOptions.length);
      setSelectedImage(import.meta.env.BASE_URL + imgOptions[idx]);
    }
    setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timerSeconds <= 0 || timeLeft <= 0) {
      return undefined;
    }

    const elapsed = timerSeconds - timeLeft;
    if (!allowGuess && elapsed >= 180) {
      setAllowGuess(true);
    }

    if (!showReminder && timeLeft === Math.floor(timerSeconds / 2)) {
      setShowReminder(true);
      setTimeout(() => setShowReminder(false), 10000);
    }

    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, timerSeconds, showReminder, allowGuess]);

  const expired = timerSeconds > 0 && timeLeft <= 0;

  useEffect(() => {
    if ((allowGuess || expired) && guess.trim().length > 0) {
      setAnswer({
        status: true,
        provenanceGraph: undefined,
        answers: { guess: guess.trim() },
      });
    } else {
      setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
    }
  }, [expired, allowGuess, guess, setAnswer]);

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
          style={{ maxWidth: '80%', marginBottom: 20, border: '1px solid #ccc' }}
        />
      )}

      {timerSeconds > 0 && !expired && (
        <div style={{ fontSize: 16, marginBottom: 20 }}>
          <span>
            Time Remaining:
            <br />
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

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
          <br />
          Please remember to speak your thoughts out loud as you work through the task.
        </div>
      )}

      {(allowGuess || expired) && (
        <div>
          <p>
            <strong>What do you think the hidden rule is?</strong>
          </p>
          <textarea
            value={guess}
            onChange={handleGuessChange}
            placeholder="Type your guess here..."
            style={{ width: '60%', height: 100, marginTop: 10 }}
          />
        </div>
      )}

      {timerSeconds > 0 && !expired && (
        <p style={{ color: '#888' }}>
          You can enter your guess after 3 minutes, or continue reasoning aloud until the timer finishes.
        </p>
      )}
    </div>
  );
}

export default ImageDisplay;
