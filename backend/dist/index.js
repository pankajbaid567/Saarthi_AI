"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const DEFAULT_PORT = 3001;
const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;
const app = (0, app_js_1.createApp)();
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
