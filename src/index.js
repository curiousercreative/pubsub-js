import PubSub from 'pubsub-js';

let i = 1;

/**
 * a simple wrapper around a popular publish/subscribe npm package https://github.com/mroderick/PubSubJS
 * we've aliased it's methods with shorter names and added channel isolation
 * @module
 * @example
 * import pubsub from '@curiouser/pubsub';
 *
 * // add a listener
 * pubsub.sub('user.loggedIn', () => alert('you logged in!')
 *
 * // nothing will happen until we trigger 'user.loggedIn' like below.
 * pubsub.pub('user.loggedIn')
 *
 * // when we're done and don't want to listen to 'user.loggedIn' anymore
 * pubsub.unsub('user.loggedIn');
 */

/**
 * @class Pubsub
 * @property {string} id - allows for discrete/scoped Pubsub broadcasts
 * @property {Map} listeners - map of function to arg juggled function
 * @property {object[]} subscriptions - listener, token, topic for use in unsub
 * @property {RegExp} topicIdRegex
 */
export class Pubsub {
  // the underlying PubSub object is a singleton, so we use this unique string as
  // a namespace to achieve discrete channeling
  id = `scope${i++}`;
  // because we're arg juggling in Pubsub.sub, we keep references to both juggled
  // and pre-juggled functions in this object for unsubscribing later
  listeners = new Map();
  subscriptions = [];
  topicIdRegex = RegExp(`^${this.id}.`);

  /**
   * once - subscription that is triggered at most once
   * @param  {string}   topic
   * @param  {Function} listener
   * @return {string}  token for unsubscribing
   * @credit https://github.com/mroderick/PubSubJS/blob/master/src/pubsub.js#L198
   */
  once (topic, listener) {
    const token = this.sub(topic, () => {
      this.unsub(token);
      listener.apply(this, arguments);
    });

    return token;
  }

  /**
   * pub
   * @param  {string} topic
   * @param  {any} data
   * @return {Promise} resolves with {boolean} whether publish was successful
   */
  pub (topic, data) {
    return new Promise(res => {
      const success = PubSub.publish(this.scopeTopic(topic), data);
      setTimeout(() => res(success), 0);
    });
  }

  /**
   * scopeTopic
   * @param  {string} topic
   * @return {string} with id prepended for scoping
   */
  scopeTopic (topic) {
    return `${this.id}.${topic}`;
  }

  /**
   * sub
   * @param  {string}   topic
   * @param  {Function} listener
   * @return {string}  token for unsubscribing
   */
  sub (topic, listener) {
    // juggle the args, but keep a reference to both juggled and prejuggled functions
    // for use in unsub. Be sure to re-use existing juggled function
    const juggledListener = this.listeners.has(listener)
      ? this.listeners.get(listener)
      : (topic, data) => listener(data, this.unscopeTopic(topic));

    this.listeners.set(listener, juggledListener);

    // reverse the order of the listener params so that data is first
    const token = PubSub.subscribe(this.scopeTopic(topic), juggledListener);

    this.subscriptions.push({ listener, token, topic });

    return token;
  }

  /**
   * unscopeTopic
   * @param  {string} topic
   * @return {string} with id prepended for scoping
   */
  unscopeTopic (topic) {
    return topic.replace(this.topicIdRegex, '');
  }

  /**
   * unsub
   * @param  {string|function} topicOrListener - most commonly, this is a topic string, but could also be a listener function
   * a topic without a listener will unsubscribe all listeners
   * a listener without a topic will unsubscribe the listener from all topics
   * @param {function} [listener] - optionally, to unsubscribe a single listener from a single topic
   * @returns {number} subscriptions cancelled, but currently unreliable so treat as weak boolean
   */
  unsub (topic, listener) {
    const hasListener = typeof listener === 'function' && this.listeners.has(listener);
    const isListener = typeof topic === 'function';
    const isToken = typeof topic === 'string' && (/^uid_[0-9]+$/).test(topic);
    const isTopic = !isToken && typeof topic === 'string';
    const predicates = [];

    // let's perform some checks
    if (!topic) throw new TypeError(`Expected a topic or token string, or listener function as first argument, received ${topic}`);
    if (!isTopic && hasListener) {
      console.warn('Received a listener as second argument but no topic string. This is a noop. If you intend to unsubscribe this listener from all topics, pass it as the only argument.');

      return 0;
    }

    // build a list of predicates that we'll use for filtering our subscription list
    if (isToken) predicates.push(sub => topic === sub.token);
    if (isTopic) predicates.push(sub => topic === sub.topic || sub.topic.match(new RegExp(`^${topic}.`)));
    if (isListener) predicates.push(sub => topic === sub.listener);
    if (isTopic && hasListener) predicates.push(sub => listener === sub.listener);

    // Array.prototype.filter predicate functions for isolating our subscriptions
    const subsToRemove = sub => predicates.every(pred => pred(sub));
    const subsToKeep = sub => !predicates.every(pred => pred(sub));

    // unsub in underlying lib
    const count = this.subscriptions
      .filter(subsToRemove)
      .map(sub => PubSub.unsubscribe(
        (isTopic && !hasListener && this.scopeTopic(topic)) // given topic, unsub by namespaced topic
        || (isListener && this.listeners.get(topic)) // given listener, unsub by mapped listener
        || (isTopic && hasListener && sub.token) // given topic + listener, unsub by token
        || (isToken && sub.token) // given token, unsub by token
      )).length;

    // filter our subscription list
    this.subscriptions = this.subscriptions.filter(subsToKeep);

    return count;
  }
}

const _global = typeof window === 'object' ? window : global;
_global.pubsub = _global.pubsub || new Pubsub();

export default _global.pubsub;
