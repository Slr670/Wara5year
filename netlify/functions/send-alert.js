// Alias route forwarding to send-email.js
const sendEmail = require('./send-email');
exports.handler = sendEmail.handler;
