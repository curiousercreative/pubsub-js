import { jest } from '@jest/globals';
import { Pubsub, default as pubsub } from '../index.js';

// NOTE: we need to wait after every pubsub.pub since it's async
describe('pubsub tests', () => {
  // NOTE: not sure how to test this...
  // test('pubsub default export should be singleton', () => {
  //
  // });

  test('pubsub default export should be instance of Pubsub', () => {
    expect(pubsub).toBeInstanceOf(Pubsub);
  });

  test('Pubsub instance should allow for a simple subscription and publish', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('a', mock);

    return instance.pub('a')
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.sub should receive data from trigger', () => {
    let receivedData;
    const instance = new Pubsub();
    function mock (data) {
      receivedData = data;
    }
    const expectedData = { key1: 'blah', key2: 'la la' };
    instance.sub('a', mock);

    return instance.pub('a', expectedData)
      .then(() => expect(receivedData).toEqual(expectedData));
  });

  test('pubsub.sub should return a token for unsubscribing', () => {
    const instance = new Pubsub();
    const mock = jest.fn();

    expect(typeof instance.sub('a', mock)).toEqual('string');
  });

  test('pubsub.pub should return a promise resolving with true when a subscriber is set', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('a', mock);

    return expect(instance.pub('a')).resolves.toBe(true);
  });

  test('pubsub.pub should return a promise resolving with false when no subscriber is set', () => {
    const instance = new Pubsub();

    return expect(instance.pub('a')).resolves.toBe(false);
  });

  // https://github.com/mroderick/PubSubJS#hierarchical-addressing
  test('pubsub.pub should publish a message to every subscriber with matching topic or within namespace', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('someModule', mock); // should be called
    instance.sub('someModule.someEvent', mock); // should be called
    instance.sub('someModule.someEvent1', mock);
    instance.sub('someModul', mock);

    return instance.pub('someModule.someEvent')
      .then(() => expect(mock.mock.calls.length).toBe(2));
  });

  test('pubsub.unsub should remove subscriptions given a topic', () => {
    const instance = new Pubsub();
    const mock = jest.fn();

    return Promise.resolve()
      .then(() => instance.sub('a', mock))
      .then(() => instance.pub('a'))
      .then(() => instance.unsub('a'))
      .then(() => instance.pub('a'))
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.unsub should remove subscriptions given a function', () => {
    const instance = new Pubsub();
    const mock = jest.fn();

    return Promise.resolve()
      .then(() => instance.sub('a', mock))
      .then(() => instance.pub('a'))
      .then(() => new Promise(resolve => setTimeout(resolve, 0)))
      .then(() => instance.unsub(mock))
      .then(() => instance.pub('a'))
      .then(() => new Promise(resolve => setTimeout(resolve, 0)))
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.unsub should remove subscriptions given a token', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    const token = instance.sub('a', mock);

    return instance.pub('a')
      .then(() => instance.unsub(token))
      .then(() => instance.pub('a'))
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.unsub by topic should return accurate count of subscriptions cancelled', () => {
    const instance = new Pubsub();
    instance.sub('a', jest.fn());
    instance.sub('a', jest.fn());
    instance.sub('a', jest.fn());

    expect(instance.unsub('a')).toBe(3);
  });

  test('pubsub.unsub by topic and listener should return accurate count of subscriptions cancelled', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('a', jest.fn());
    instance.sub('a', mock);
    instance.sub('a', jest.fn());

    expect(instance.unsub('a', mock)).toBe(1);
  });

  test('pubsub.unsub by topic and listener should return accurate count of subscriptions cancelled', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    const token = instance.sub('a', jest.fn());
    instance.sub('a', mock);
    instance.sub('a', jest.fn());

    expect(instance.unsub(token)).toBe(1);
  });

  test('pubsub.pub should not trigger newly created Pubsub listener for the same topic', () => {
    const instance = new Pubsub();
    const mock = jest.fn();

    return Promise.resolve()
      .then(() => instance.sub('a', mock))
      .then(() => pubsub.pub('a', 'b'))
      .then(() => expect(mock).not.toBeCalled());
  });

  test('pubsub.once should listen for only a single publish', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.once('a', mock);

    return instance.pub('a')
      .then(() => instance.pub('a'))
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.once should return token for unsubscribing and not listen to publishes', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.unsub(instance.once('a', mock));

    return instance.pub('a')
      .then(() => expect(mock.mock.calls.length).toBe(0));
  });

  test('pubsub.sub with identical callbacks and different topics', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('a', mock);
    instance.sub('b', mock);

    return instance.pub('a')
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.sub with identical topics and different callbacks', () => {
    const instance = new Pubsub();
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    instance.sub('a', mock1);
    instance.sub('a', mock2);

    instance.unsub(mock1);

    return instance.pub('a')
      .then(() => expect(mock2.mock.calls.length).toBe(1));
  });

  test('pubsub.unsub by topic with identical callbacks', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('a', mock);
    instance.sub('b', mock);

    instance.unsub('b');

    return instance.pub('a')
      .then(() => expect(mock.mock.calls.length).toBe(1));
  });

  test('pubsub.unsub by topic with identical topics', () => {
    const instance = new Pubsub();
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    instance.sub('a', mock1);
    instance.sub('a', mock2);

    instance.unsub('a');

    return instance.pub('a')
      .then(() => expect(mock1.mock.calls.length + mock2.mock.calls.length).toBe(0));
  });

  test('pubsub.unsub by callback with identical callbacks', () => {
    const instance = new Pubsub();
    const mock = jest.fn();
    instance.sub('a', mock);
    instance.sub('b', mock);

    instance.unsub(mock);

    return instance.pub('a')
      .then(() => expect(mock.mock.calls.length).toBe(0));
  });

  test('pubsub.unsub by topic should unsubscribe with descendant topic subscribers', () => {
    const instance = new Pubsub();
    const mock = jest.fn(console.log);
    instance.sub('user', mock);
    instance.sub('user.loggedIn', mock);

    expect(instance.unsub('user')).toBe(2);

    return Promise.all([ instance.pub('user.loggedIn', 'b'), instance.pub('user', 'a') ])
      .then(() => expect(mock.mock.calls.length).toBe(0));
  });
});
