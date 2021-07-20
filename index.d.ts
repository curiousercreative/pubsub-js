export function listener(message: any, topic: string): void;
export type token = string;
export type topic = string;

export namespace Pubsub {
  export function once (topic: topic, listener: listener): token;
  export function pub (topic: topic, message: any): Promise<boolean>;
  export function sub (topic: topic, listener: listener): token;
  export function unsub (topic: topic | token | listener, listener?: listener): number;
}

export const pubsub: Pubsub;
