export const ScriptType = {
  P2SH: 'p2sh',
  P2WSH: 'p2wsh',
  P2TR: 'p2tr',
} as const;

export type ScriptType = typeof ScriptType[keyof typeof ScriptType];
