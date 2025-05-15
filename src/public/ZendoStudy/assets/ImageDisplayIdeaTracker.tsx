import React, { useState, useEffect } from 'react';

type Idea = {
  text: string;
  timestamp: number;
};

type ImageDisplayParams = {
  parameters: {
    imgOptions?: string[]; // now used for a single static image
    instructions: string;
    timerSeconds?: number;
    enableIdeaTracker?: boolean;
  };
  setAnswer: (args: {
    status: boolean;
    provenanceGraph?: unknown;
    answers: Record<string, string | Idea[]>;
  }) => void;
};

function ImageDisplay({ parameters, setAnswer }: ImageDisplayParams) {
  const {
    imgOptions = [],
    instructions,
    timerSeconds = 0,
    enableIdeaTracker = false,
  } = parameters;

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds);
  const [guess, setGuess] = useState<string>('');
  const [showReminder, setShowReminder] = useState<boolean>(false);
  const [ideaInput, setIdeaInput] = useState('');
  const [ideaList, setIdeaList] = useState<Idea[]>([]);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);

  useEffect(() => {
    setTaskStartTime(Date.now());
  }, []);

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

    if (!showReminder && timeLeft === Math.floor(timerSeconds / 2)) {
      setShowReminder(true);
    }

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, timerSeconds, showReminder]);

  const expired = timerSeconds <= 0 || timeLeft <= 0;

  useEffect(() => {
    if (expired && guess.trim().length > 0) {
      setAnswer({
        status: true,
        provenanceGraph: undefined,
        answers: {
          guess: guess.trim(),
          ideaTracker: ideaList,
        },
      });
    } else {
      setAnswer({ status: false, provenanceGraph: undefined, answers: {} });
    }
  }, [expired, guess, ideaList, setAnswer]);

  const handleGuessChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGuess(e.target.value);
  };

  const handleAddIdea = () => {
    if (ideaInput.trim() && taskStartTime !== null) {
      const now = Date.now();
      const timestampInSeconds = Math.round((now - taskStartTime) / 1000);
      setIdeaList((prev) => [...prev, { text: ideaInput.trim(), timestamp: timestampInSeconds }]);
      setIdeaInput('');
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

      {enableIdeaTracker && (
        <div
          style={{
            position: 'fixed',
            top: '200px',
            right: '30px',
            width: '280px',
            backgroundColor: '#f9f9f9',
            border: '1px solid #ccc',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            zIndex: 999,
            fontSize: '.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Ideas:</h4>
            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#444' }}>
              Please remember to continue thinking out loud
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddIdea();
                }
              }}
              placeholder="Enter an idea"
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '6px',
              }}
            />
            <button
              type="button"
              onClick={handleAddIdea}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '6px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>

          <ul style={{
            maxHeight: '160px', overflowY: 'auto', paddingLeft: '20px', margin: 0,
          }}
          >
            {ideaList.map((idea, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>
                {idea.text}
              </li>
            ))}
          </ul>
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
