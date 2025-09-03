import React from 'react';
import { GardenProvider, useGarden } from '@gardenfi/react-hooks';
import SwapWidget from './SwapWidget';

type Props = React.ComponentProps<typeof GardenProvider>;

export const Garden: React.FC<Props> = ({ ...providerProps }) => {
  return (
    <GardenProvider {...providerProps}>
      <SwapWidget />
    </GardenProvider>
  );
};

export { useGarden };
