const Client = require('./client');

let myClient = Client({timeout: 1000, debug: false});

myClient
  .listen('0001')
  .then(_ => {
    console.log('making  request');
    const makeRequest = _ => {
      myClient
        .request('0000', {method: 'hello', payload: 42})
        .then(res => {
          console.log(`Server responded with ${JSON.stringify(res)}`);
        })
        .catch(e => console.log(`Error occured: ${e.message}`));
    };
    setInterval(makeRequest, 5000);
    makeRequest();
  })
  .catch(e => console.log(`aaaarg ${e.message}`));
