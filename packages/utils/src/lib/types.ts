export type MarkRequired<T, K extends keyof T> = {
  [P in K]-?: T[P];
} &
  T;
