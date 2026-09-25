const { ok } = require('../utils/response');
const svc = require('../services/dashboard.service');

exports.summary = async (req, res) =>
  ok(res, await svc.summary(req.user, req.query));

exports.byProduct = async (req, res) =>
  ok(res, await svc.byProduct(req.user, req.query));

exports.timeline = async (req, res) =>
  ok(res, await svc.timeline(req.user, req.query));

exports.ledger = async (req, res) =>
  ok(res, await svc.ledger(req.user, req.query));

exports.payments = async (req, res) =>
  ok(res, await svc.payments(req.user, req.query));

exports.overview = async (req, res) =>
  ok(res, await svc.overview(req.user, req.query));