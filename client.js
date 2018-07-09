const IPC = require('redis-ipc');

// TODO: client.connect
// TODO: client.request(...).then(response=> {...}).catch(e)
//
const _client = params => {
  let _params = Object.assign({}, params);
  let self = IPC(_params);
  self._connected = false;
  self._requestTimeout = 5000;
  if (typeof _params.timeout !== 'undefined') {
    self._requestTimeout = _params.timeout;
  }
  self._requests = [];

  self.listen = channel => {
    return new Promise((resolve, reject) => {
      self.on('error', reject);
      self.connect().then(_ => {
        if (typeof channel === 'undefined') {
          throw new Error('Please specify client channel for responses');
        }
        self._clientChannel = channel;
        //DONE:subscribe
        self
          .subscribe(channel)
          .on('subscribe', _ => {
            resolve();
          })
          .on('error', reject)
          .on('message', message => {
            // DONE: process response
            try {
              let data = JSON.parse(message);
              let method = data.method;
              let payload = data.payload;
              let response = {
                method: method,
                payload: payload
              };
              let responseId = data['response_id'];
              // DONE: find response

              let originIndex = self._requests.findIndex(
                t => t.id === responseId
              );
              if (originIndex > -1) {
                let originRequest = self._requests[originIndex];

                // error handling
                if (data.method === 'error') {
                  originRequest.reject(response);
                } else {
                  originRequest.resolve(response);
                }

                // clear request timeout in any case
                clearTimeout(originRequest.timeout);

                self._requests.splice(originIndex, 1);
              } else {
                self.debug(`Cannot find request with id ${responseId}`);
              }
            } catch (e) {
              throw e;
            }
          });
      });
    });
  };
  self.request = (channel, data) => {
    let requestId = Math.floor(Math.random() * Math.floor(0xffff));
    let requestPromise = new Promise((resolve, reject) => {
      let request = {};
      // required
      request['request_id'] = requestId;
      request['client_channel'] = self._clientChannel;
      // opt
      request.method = data.method;
      request.payload = data.payload;

      let message = JSON.stringify(request);

      self.publish(channel, message);
      // TODO: timeout time as const
      let _timeout = setTimeout(_ => {
        //remove item from requests array
        let requestIndex = self._requests.findIndex(t => t.id === requestId);
        if (requestIndex > -1) {
          self._requests.splice(requestIndex, 1);
        }

        // reject promise
        let err = new Error('Request timeout');
        reject(err);
      }, self._requestTimeout);
      self._requests.push({
        id: requestId,
        resolve: resolve,
        reject: reject,
        timeout: _timeout
      });
    });

    return requestPromise;
  };

  return self;
};

module.exports = _client;
