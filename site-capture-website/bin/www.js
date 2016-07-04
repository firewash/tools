'use strict';
const app = require('../app');
const debug = require('debug')('blog:server');
const http = require('http');
const loggie = require('../lib/loggie').logger;
const config = require('../config');

/**
 * Get port from environment and store in Express.
 */
function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }
    return false;
}

const port = normalizePort(process.env.PORT || config.port);
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? `Pipe ${port}`
        : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        loggie.error(bind, ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        loggie.error(bind, ' is already in use');
        process.exit(1);
        break;
    default:
        throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? `pipe ${addr}`
        : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */


module.exports = server;
