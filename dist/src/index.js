"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const app_1 = __importDefault(require("./app/app"));
const env_1 = require("./config/env");
const port = env_1.env.PORT;
console.log(`Starting server on port ${port}...`);
(0, node_server_1.serve)({
    fetch: app_1.default.fetch,
    port
}, info => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
});
