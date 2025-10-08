import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001/api/v1/ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connected');

  // Subscribe to BTC and ETH updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbols: ['BTC', 'ETH']
  }));

  console.log('📡 Subscribed to BTC and ETH price updates');
});

ws.on('message', function incoming(data) {
  const message = JSON.parse(data);
  console.log('📨 Received:', JSON.stringify(message, null, 2));
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket disconnected');
});

// Keep alive for 30 seconds to see price updates
setTimeout(() => {
  console.log('⏱️  Test complete, closing connection');
  ws.close();
  process.exit(0);
}, 30000);
