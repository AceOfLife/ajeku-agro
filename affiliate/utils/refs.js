const crypto = require('crypto');

const rand = (n = 4) =>
  crypto.randomInt(0, 10 ** n).toString().padStart(n, '0');

const pad = (n) => String(n).padStart(2, '0');

const saleRef = () => `AJ-SL-${rand(4)}`;

const paymentRef = (date = new Date()) =>
  `AJ-PY-${pad(date.getMonth() + 1)}${pad(date.getDate())}-${rand(4)}`;

module.exports = { saleRef, paymentRef };