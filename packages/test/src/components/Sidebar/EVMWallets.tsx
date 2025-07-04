import { Button } from "../common/Button";
import { getAccount } from "wagmi/actions";
import { Connector, useConnect } from "wagmi";
import { config } from "../../main";

export const EVMWallets = () => {
    const { connectors } = useConnect();
    const account = getAccount(config)

    const connectWallet = async (connector: Connector) => {
        await connector.connect();
    }
    return (
        <div className='flex flex-col items-start justify-start gap-2'>
            <h2 className='text-sm opacity-60'>EVM Wallets</h2>
            <div className='grid grid-cols-2 gap-2 w-full'>
                {connectors.map((connector) => {
                    return (
                        <Button
                            disabled={account.status === "connected"}
                            key={connector.uid}
                            onClick={() => connectWallet(connector)}
                        >
                            {connector.name}
                        </Button>
                    );
                })}
            </div>
        </div>
    )
};