import React, { useEffect, useState } from 'react';
import {
  Text, Center, Flex, Button,
} from '@mantine/core';
import { useStorageEngine } from '../../../storage/storageEngineHooks';

function ParticipantIdDisplay() {
  const { storageEngine } = useStorageEngine();
  const [participantId, setParticipantId] = useState<string>('');

  useEffect(() => {
    const fetchId = async () => {
      if (storageEngine) {
        const id = await storageEngine.getCurrentParticipantId();
        setParticipantId(id);
      }
    };
    fetchId();
  }, [storageEngine]);

  return (
    <Center style={{ height: '100%' }}>
      <Flex direction="column" align="center">
        <Text size="xl" fw={700} mb="md">Your Participant ID</Text>
        <Text size="lg" mb="sm">{participantId}</Text>
        <Text mb="lg">Please save this ID in case you wish to request deletion of your data in the future.</Text>
        <Text mb="lg" fw={500}>
          Pressing
          {' '}
          <strong>Next</strong>
          {' '}
          will end the study and redirect you back to Prolific.
        </Text>
      </Flex>
    </Center>
  );
}

export default ParticipantIdDisplay;
