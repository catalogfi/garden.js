import fs from 'fs';
import path from 'path';

const configPath = path.resolve(__dirname, '../../../../config.json');

const defaultConfig = {
    LOCALNET: {
        orderbook: "",
        quote: "",
        info: "",
        bitcoin: "",
        ethereum: "",
        arbitrum: "",   
        btcnode: ""
    }
};

const loadConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return {
                orderbook: config.LOCALNET.orderbook || defaultConfig.LOCALNET.orderbook,
                quote: config.LOCALNET.quote || defaultConfig.LOCALNET.quote,
                info: config.LOCALNET.info || defaultConfig.LOCALNET.info,
                bitcoin: config.LOCALNET.bitcoin || defaultConfig.LOCALNET.bitcoin,
                ethereum: config.LOCALNET.ethereum || defaultConfig.LOCALNET.ethereum,
                arbitrum: config.LOCALNET.arbitrum || defaultConfig.LOCALNET.arbitrum,
                btcnode: config.LOCALNET.btcnode || defaultConfig.LOCALNET.btcnode
            };
        }
    } catch (error) {
        console.error("Error reading config file:", error);
    }

    return defaultConfig.LOCALNET;
};

const API = {
    localnet: loadConfig(),
};

export { API };
