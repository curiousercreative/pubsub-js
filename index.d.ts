export type listener = (message: any, topic: string) => void;
export type token = string;
export type topic = string;

export declare class Pubsub {
  once (topic: topic, listener: listener): token;
  pub (topic: topic, message: any): Promise<boolean>;
  sub (topic: topic, listener: listener): token;
  unsub (topic: topic | token | listener, listener?: listener): number;
}

declare const _default: Pubsub;
export default _default;
