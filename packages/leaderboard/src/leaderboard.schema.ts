import { array, object, string, number, lazy } from 'yup';

export const leaderboardSchema = array(
  object({
    user_address: string().required(),
    amount: string().required(),
  }).required()
).required();

export const raffleEntry = object({
  ID: number().required(),
  CreatedAt: string().required(),
  UpdatedAt: string().required(),
  DeletedAt: string().nullable(),
  user_address: string().required(),
  amount: string().required(),
  partner: string().required(),
});

export const questsSchema = object({
  oneTimeBonus: array(raffleEntry).required(),
  raffleEntries: array(raffleEntry.omit(['amount'])).required(),
  raffleWinners: array(raffleEntry).required(),
}).required();

export const orderRewardSchema = object({
  ID: number().required(),
  CreatedAt: string().required(),
  UpdatedAt: string().required(),
  DeletedAt: string().nullable(),
  order_id: number().required(),
  user_address: string().required(),
  amount: string().required(),
  multiplier: number().required(),
  status: number().required(),
}).required();

export const remainingSeedSchema = string().required();

export const claimGardenQuestSchema = lazy((value) => {
  if (value.message)
    return object({
      message: string().required(),
    });
  else
    return object({
      error: string().required(),
    });
});

export const claimIntegrationFeesSchema = number().required();
