============
redis-ipc-qs
============

Intro
_____

Simple nodejs library to communicate over redis-ipc. qs in title stands for reQuest/reSponse.

Example server usage:

.. code-block:: javascript

    const Server = require('redis-ipc-qs').Server;
    let myServer = Server((req, res) => {
      console.log('got request', req);

      // Here we handle request
      res.method = req.method;
      res.payload = req.payload;
      res.send();
    });


    myServer.on('error', console.log);

    myServer.listen('0000');

Example client usage:

.. code-block:: javascript

    const Client = require('redis-ipc-qs').Client;

    let myClient = Client({timeout: 1000});

    myClient
      .listen('0001')
      .then(_ => {
          console.log('making  request');
          myClient
            .request('0000', {method: 'hello', payload: 42})
            .then(res => {
              console.log(`Server responded with ${JSON.stringify(res)}`);
            })
            .catch(e => console.log(`Error occured: ${e.message}`));
      })
      .catch(e => console.log(`aaaarg ${e.message}`));
      

There are not more than five musical notes, yet the combinations of these five give rise to more melodies than can ever be heard. There are not more than five primary colors (blue, yellow, red, white, and black), yet in combination they produce more hues than can ever been seen.	There are not more than five cardinal tastes (sour, acrid, salt, sweet, bitter), yet combinations of them yield more flavors than can ever be tasted. In battle, there are not more than two methods of attack - the direct and the indirect; yet these two in combination give rise to an endless series of maneuvers. The direct and the indirect lead on to each other in turn. It is like moving in a circle - you never come to an end. Who can exhaust the possibilities of their combination?
 
Requests and responses are restricted only by two fields: "method" and "payload". The rest depends on you.

Usage
_____

.. code-block:: javascript

    let myServer = Server((req, res) => {// handler});
    
    // with params
    let myServer = Server((req, res) => {// handler}, {
      debug: true,
      path: '/var/run/redis/redis.sock'
    });


    let myClient = Client();
    // with params
    let myClient = Client({
      debug: true,
      path : '/tmp/redis.sock'
      timeout: 5000
    });

By default path parameter is "/var/run/redis/redis.sock". You may also try to set path to redis url: "redis://user:password@host:port".
Client request timeout default value is 5000ms.
