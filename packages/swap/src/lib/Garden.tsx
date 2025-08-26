import React from 'react';
import { GardenProvider, useGarden } from '@gardenfi/react-hooks';

type Props = React.ComponentProps<typeof GardenProvider>;

export const Garden: React.FC<Props> = ({ children, ...providerProps }) => {
  return <GardenProvider {...providerProps}>{children}</GardenProvider>;
};

export { useGarden };
