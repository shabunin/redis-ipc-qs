const IPC = require('redis-ipc');

// in analogy with http.createServer((req, res) => {...});
const _server = (handler, params) => {
  let _params = Object.assign({}, params);
  let self = IPC(_params);
  if (typeof handler === 'function') {
    self.requestHandler = handler;
  }

  self.listen = channel => {
    return self.connect().then(_ => {
      self.subscribe(channel).on('message', message => {
        // TODO: response as a new Proxy?
        let response = {
          _data: {},
          send: _ => {
            // init object with required fields
            let initial = {};
            initial['response_id'] = response['response_id'];

            // then merge with data
            let obj = Object.assign(initial, response._data);
            let message = JSON.stringify(obj);
            // send to channel that client listens
            let clientChannel = response['client_channel'];

            return self.publish(clientChannel, message);
          }
        };

        // DONE: duplex channels
        try {
          let data = JSON.parse(message);

          // checking
          if (!Object.prototype.hasOwnProperty.call(data, 'request_id')) {
            throw new Error('Request should have id');
          }
          let requestId = data['request_id'];

          // client_channel
          if (!Object.prototype.hasOwnProperty.call(data, 'client_channel')) {
            throw new Error('Plese set client channel for response handling');
          }
          let clientChannel = data['client_channel'];

          // checking for loop
          if (clientChannel === channel) {
            throw new Error('Please set client channel other than servers');
          }

          // assigning
          response['response_id'] = requestId;
          response['client_channel'] = clientChannel;

          let proxyHandler = {
            get: (obj, prop, receiver) => {
              if (prop === 'send') {
                return obj.send;
              }

              return obj._data[prop];
            },
            set: (obj, prop, value, receiver) => {
              if (prop === 'method' || prop === 'payload') {
                obj._data[prop] = value;
              } else {
                throw new Error('Please set only method and payload fields');
              }
            }
          };

          // response proxy to send to responseHandler
          let responseProxy = new Proxy(response, proxyHandler);

          // request object to be processed in handler
          let request = {};
          request.method = data['method'];
          request.payload = data['payload'];
          if (typeof self.requestHandler === 'function') {
            self.requestHandler(request, responseProxy);
          }
        } catch (e) {
          self.emit('error', e);
        }
      });
    });
  };

  // finally, return self object
  return self;
};

module.exports = _server;
