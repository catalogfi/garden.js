import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser';

export type PasskeyToken = {
  token: string;
  gardenUserName: string;
};

export type RegisterChallenge = {
  challenge: {
    publicKey: PublicKeyCredentialCreationOptionsJSON;
  };
};

export type ConditionalLoginChallenge = {
  challenge: {
    publicKey: PublicKeyCredentialCreationOptionsJSON;
  };
  login_id: string;
};
