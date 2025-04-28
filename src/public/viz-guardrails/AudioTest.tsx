/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */

import React, { useEffect } from 'react';
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

  useEffect(() => {
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
          if (!soundDetected && maxDelta > 15) {
            soundDetected = true;

            // 1) update your hidden-radio (sidebar)
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
      <Stack>
        <Text ta="center">
          Please allow us to access your microphone. There may be a popup in your browser window asking for access, click accept.
        </Text>
        <Text ta="center">
          Once we can confirm that your microphone is on and we hear you say something, the continue button will become available.
        </Text>
        <Text ta="center" fw={700}>
          If you are not comfortable or able to speak English during this study, please return the study.
        </Text>
        <Center>
          <RecordingAudioWaveform height={200} width={400} />
        </Center>
      </Stack>
    </Center>
  );
}

export default AudioTest;
