const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 'Validation error', 422, errors.array());
  }
  next();
};

module.exports = { validate };