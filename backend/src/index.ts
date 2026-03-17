import { createApp } from './app.js';

const DEFAULT_PORT = 3001;
const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;

const app = createApp();

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
