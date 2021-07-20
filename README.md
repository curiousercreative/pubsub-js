# @curiouser/pubsub
A lightweight wrapper around [pubsub-js](https://github.com/mroderick/PubSubJS) to enable:
- multiple "isolated" instances
- aliased and simplified subset of API methods
- automatic singleton across mutliple bundles/chunks

## Install
### NPM
```bash
npm install @curiouser/pubsub
```

### Yarn
```bash
yarn add @curiouser/pubsub
```

## Basic Usage
```javascript
import pubsub from '@curiouser/pubsub';

function listener1 (message) {
  console.log('listener1', message);
}

pubsub.sub('topicA', listener1);
pubsub.pub('topicA', 'simple string');
// => 'listener1, simple string'

pubsub.unsub('topicA', listener1); // unsubscribe a single listener from topicA
```

## Advanced Usage
```javascript
import { Pubsub } from '@curiouser/pubsub';

const pubsub = new Pubsub(); // construct your own instance

function listener1 (message, topic) {
  console.log('listener1', message, topic);
}

pubsub.sub('topicA', listener1);

// hierarchical topic addressing, message as arbitrary data type
const subscriptionToken = pubsub.pub('topicA.action1', { a: 'a', b: 'b' });
// => 'listener1, { a: 'a', b: 'b' }, topicA.action1'

// unsubscribe from a topic with no subscribers
let unsubCount = pubsub.unsub('topicB'); // 0

// unsubscribe all listeners from topic with subscriptions
unsubCount += pubsub.unsub('topicA'); // 1

// unsubscribe single listener from all topics
unsubCount += pubsub.unsub(listener1); // 1

// subscribe for at most most a single message publishe
pubsub.once('topicA.action2', console.log)
```

## API/Type references
[API/Type reference can be found in ./index/d.ts](./index.d.ts)

## Browser support
Package as ESM and requires [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map). With a Promise polyfill and bundling (with module transpiling), IE11 is supported.
