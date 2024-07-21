import net from 'net';

// Get a random port
function getRandomPort() {
  return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}


// Checks if the port is available
function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

// Get the available port and export it
export default async function getAvailablePort() {
  let port = getRandomPort();
  let available = await isPortAvailable(port);

  while (!available) {
    port = getRandomPort();
    available = await isPortAvailable(port);
  }

  return port;
}

