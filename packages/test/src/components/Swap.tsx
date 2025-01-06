import { useGarden } from '@gardenfi/react-hooks';
import './../App.css';
import { Sidebar } from './Sidebar/Sidebar';
import SwapComponent from './SwapComponent/SwapComponent';

export const Swap = () => {
  const { garden } = useGarden();
  console.log('garden :', garden);

  return (
    <div className="flex w-full">
      <Sidebar />
      <SwapComponent />
    </div>
  );
};
