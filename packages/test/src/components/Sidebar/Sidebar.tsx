import { Button } from "@gardenfi/garden-book";
import { BTCWallets } from "./BTCWallets";
import { Details } from "./Details";
import { EVMWallets } from "./EVMWallets";
import LogoutButtons from "./LogoutButtons";
import { SupportedChains } from "./SupportedChains";
import { useState } from "react";
import { PasskeyLogin, Url } from "@gardenfi/utils";
import { useAuthStore } from "../../store/authStore";

export const Sidebar = () => {
  const [username, setUsername] = useState("");

  const {setAuthToken} = useAuthStore();

  const url = new Url("http://localhost:4427");

  const handlePasskeySignUp = async (username: string) => {
    try {
      const signupUsername = await new PasskeyLogin(url, 'passkey-auth').register(username);
      if(signupUsername.ok) setAuthToken(signupUsername.val.token)
  
      console.log("Passkey SignUp Response:", signupUsername);
    } catch (error) {
      console.error("Error during Passkey SignUp:", error);
    }
  };

  const handlePasskeyLogin = async (username: string) => {
    try {
      const loginUsername = await new PasskeyLogin(url, 'passkey-auth').login(username);
      if(loginUsername.ok) setAuthToken(loginUsername.val.token)
  
      console.log("Passkey LogIn Response:", loginUsername);
    } catch (error) {
      console.error("Error during Passkey Login:", error);
    }
  };

  return (
    <div className='flex flex-col space-y-8 bg-white px-6 pt-6 pb-12 h-screen w-full overflow-y-auto custom-scrollbar'>
      <div className="flex w-full items-center justify-between">
        <h2 className='text-lg font-semibold text-[#E36492]'>Test GardenJs</h2>
        <LogoutButtons />
      </div>
      <Details />
      <input 
      className="py-2 pl-2"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      <div className="flex items-center justify-between gap-2">
      <Button className="border w-full rounded-md py-1 hover:bg-red-200 transition-all duration-300" onClick={() => handlePasskeySignUp(username)}>
          Sign up
      </Button>
      <Button className="border w-full rounded-md py-1 hover:bg-red-200 transition-all duration-300" onClick={() => handlePasskeyLogin(username)}>
          Passkey Login
      </Button>
      </div>
      <EVMWallets />
      <BTCWallets />
      <SupportedChains />
    </div>
  )
};