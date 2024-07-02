import { exec } from 'child_process';

export const fund = async (address: string) => {
  exec(`merry faucet --to ${address}`);

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, 5000);
  });
};
