/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */

import React, { useEffect, useState } from 'react';
import { Center, Stack, Text } from '@mantine/core';
import RecordingAudioWaveform from '../../components/interface/RecordingAudioWaveform';
import { StimulusParams } from '../../store/types';

// NEW imports for manual validation dispatch
import { useStoreDispatch, useStoreActions } from '../../store/store';
import { useCurrentComponent, useCurrentStep } from '../../routes/utils';

export function AudioTest({ parameters, setAnswer }: StimulusParams<any>) {
  const dispatch = useStoreDispatch();
  const { updateResponseBlockValidation } = useStoreActions();
  const currentComponent = useCurrentComponent();
  const currentStep = useCurrentStep();
  const identifier = `${currentComponent}_${currentStep}`;
  const [audioDetected, setAudioDetected] = useState(false);
  const [readyToProceed, setReadyToProceed] = useState(false);

  useEffect(() => {
    setAnswer({
      status: false,
      provenanceGraph: undefined,
      answers: {},
    });
    dispatch(updateResponseBlockValidation({
      location: 'belowStimulus',
      identifier,
      status: false,
      provenanceGraph: undefined,
      values: {},
    }));
    let animationId: number;
    let soundDetected = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        await audioContext.resume();

        // (Optional) amplify mic input a bit
        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 3;
        source.connect(gainNode);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        gainNode.connect(analyser);

        const buffer = new Uint8Array(analyser.fftSize);

        const detect = () => {
          analyser.getByteTimeDomainData(buffer);

          // compute max deviation from silence (128)
          let maxDelta = 0;
          for (let i = 0; i < buffer.length; i += 1) {
            const delta = Math.abs(buffer[i] - 128);
            if (delta > maxDelta) maxDelta = delta;
          }

          // tuning: fire on any non-zero deviation
          if (!soundDetected && setAudioDetected && maxDelta > 15) {
            soundDetected = true;
            setAudioDetected(true);

            // 1) update hidden-radio (sidebar)
            setAnswer({
              status: true,
              provenanceGraph: undefined,
              answers: { audioTest: 'yes' },
            });

            // 2) also validate the belowStimulus block for NextButton
            dispatch(updateResponseBlockValidation({
              location: 'belowStimulus',
              identifier,
              status: true,
              provenanceGraph: undefined,
              values: { audioTest: 'yes' },
            }));

            cancelAnimationFrame(animationId);
            return;
          }

          animationId = requestAnimationFrame(detect);
        };

        detect();
      } catch (err) {
        console.error('AudioTest init error', err);
      }
    }

    init();
    return () => cancelAnimationFrame(animationId);
  }, [dispatch, identifier, setAnswer, updateResponseBlockValidation]);

  return (
    <Center style={{ height: '70%', width: '100%' }}>
      <Stack gap="lg">
        {!audioDetected ? (
          <>
            <Text ta="center">
              Please allow us to access your microphone. There may be a popup in your browser window asking for access - click allow.
            </Text>
            <Text ta="center">
              Once we confirm your microphone is working and we hear you speak, you’ll see a message to begin the task.
            </Text>
            <Text ta="center" fw={700}>
              If you are not comfortable or able to speak English during this study, please return the study.
            </Text>
            <Text ta="center" fw={600}>
              Please say this aloud to test your microphone:
              <br />
              “I will talk through my thoughts while solving each puzzle.”
            </Text>
          </>
        ) : (
          <>
            <Text ta="center" fw={600} c="green">
              ✅ Your microphone is working!
            </Text>
            <Text ta="center">
              If you are ready to begin the task, click the button below.
            </Text>
            <Center>
              <button
                type="button"
                onClick={() => {
                  setReadyToProceed(true);
                  setAnswer({
                    status: true,
                    provenanceGraph: undefined,
                    answers: { audioTest: 'yes' },
                  });
                  dispatch(updateResponseBlockValidation({
                    location: 'belowStimulus',
                    identifier,
                    status: true,
                    provenanceGraph: undefined,
                    values: { audioTest: 'yes' },
                  }));
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#0077cc',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Start Task
              </button>
            </Center>
          </>
        )}

        <Center>
          <RecordingAudioWaveform height={200} width={400} />
        </Center>
      </Stack>
    </Center>
  );
}

export default AudioTest;
