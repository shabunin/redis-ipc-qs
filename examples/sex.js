const Server = require('../server');

let myServer = Server((req, res) => {
  console.log(req);
  //  res.me = 'echo server';
  res.method = req.method;
  res.payload = req.payload;
  res.send();
});

//console.log(myServer);

myServer.on('error', console.log);

myServer.listen('0000');
