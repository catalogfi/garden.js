import './../App.css';
import { Sidebar } from './Sidebar/Sidebar';
import SwapComponent from './SwapComponent/SwapComponent';

export const Swap = () => {
  return (
    <div className="flex w-full">
      <Sidebar />
      <SwapComponent />
    </div>
  );
};
