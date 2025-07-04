import { BTCWallets } from "./BTCWallets";
import { Details } from "./Details";
import { EVMWallets } from "./EVMWallets";
import LogoutButtons from "./LogoutButtons";
import { SupportedChains } from "./SupportedChains";

export const Sidebar = () => {
  return (
    <div className='flex flex-col space-y-8 bg-white px-6 pt-6 pb-12 h-screen w-full overflow-y-auto custom-scrollbar'>
      <div className="flex w-full items-center justify-between">
        <h2 className='text-lg font-semibold text-[#E36492]'>Test GardenJs</h2>
        <LogoutButtons />
      </div>
      <Details />
      <EVMWallets />
      <BTCWallets />
      <SupportedChains />
    </div>
  )
};
