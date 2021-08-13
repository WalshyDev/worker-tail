export default function connect(url, protocol, connectFn, messageFn, errorFn) {
  const ws = new WebSocket(url + '/ws', [protocol], {
    protocolVersion: 13,
    perMessageDeflate: true,
  });

  ws.onopen = () => {
    connectFn();
  }

  ws.onmessage = (msg) => {
    messageFn(msg);
  }

  ws.onerror = (msg) => {
    errorFn(msg);
  }
}