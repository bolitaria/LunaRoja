const Joi = require('joi');

function buildSignatureSchema(fields) {
  const shape = {};
  fields.forEach(field => {
    let validator;
    switch (field.type) {
      case 'email':
        validator = Joi.string().email();
        break;
      case 'text':
      case 'textarea':
        validator = Joi.string().max(500);
        break;
      case 'number':
        validator = Joi.number();
        break;
      default:
        validator = Joi.string();
    }
    if (field.required) validator = validator.required();
    else validator = validator.allow('', null).optional();
    shape[field.name] = validator;
  });
  return Joi.object(shape).unknown(false);
}

module.exports = { buildSignatureSchema };
