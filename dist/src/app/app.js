"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const app = new hono_1.Hono();
// Global Middlewares
app.use('*', (0, logger_1.logger)());
app.use('*', (0, cors_1.cors)());
// Health Check
app.get('/health', c => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// Example route
app.get('/', c => {
    return c.text('Welcome to YouGO API');
});
// 404 Handler
app.notFound(c => {
    return c.json({ message: 'Not Found' }, 404);
});
// Error Handler
app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({ message: 'Internal Server Error' }, 500);
});
exports.default = app;
