onconnect = function (event) {
  console.log('worker loaded');

  const port = event.ports[0];

  port.onmessage = function (e) {
    console.log('worker message received');
    const workerResult = `Result: ${e.data[0] * e.data[1]}`;
    port.postMessage(workerResult);
  };
};

