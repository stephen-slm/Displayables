const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const languageService = require('../services/Language.service');

/**
 * Salts then hashes the password 28000 times, if no salt is passed then one will be generated.
 * @param {string} password The password to be salted and hashed.
 * @param {string | null} salt The salt to be used for the securing process.
 */
function saltAndHash(password, salt) {
  if (_.isNil(salt)) {
    salt = crypto.randomBytes(128).toString('base64');
  }

  // encrypt the password securely using the salt password and 512 sha.
  const securePassword = crypto.pbkdf2Sync(password, salt, 28000, 512, 'sha512');

  return {
    password: securePassword.toString('hex'),
    salt
  };
}

/**
 * Compares a pure password to a secure password via salt and hash. Returns true if matched, false
 * otherwise.
 * @param {string} purePassword The password being used to authenticate with.
 * @param {string} salt The salt to validate the authenticating password.
 */
function comparePasswords(purePassword, salt, securePassword) {
  if (_.isNil(purePassword)) return false;

  const hashedPassword = saltAndHash(purePassword, salt);
  return hashedPassword.password === securePassword;
}

/**
 * Signs a jw-token for web authentication and validation of the signed in user.
 * @param {string} name The name to add to the token payload.
 * @param {string} id The id of the user to add to the token payload.
 * @param {string} secret The secret to secure the token.
 */
function signAuthenticationToken(username, name, id, secret) {
  return jwt.sign({ username, name, id }, secret, { expiresIn: '3h' });
}

/**
 * Decode the token.
 * @param {string} token The token to be decoded.
 */
function parseJwt(token) {
  return jwt.decode(token);
}

/**
 * Validates that the token was secured with the provided secret.
 * @param {string} token The jwt token to validate with the secret.
 * @param {string} secret The secret used to secure/validate the token.
 */
function validateAuthenticationToken(token, secret) {
  let verification = null;

  jwt.verify(token, secret, (error, decoded) => {
    verification = { error, decoded };
  });

  return verification;
}

/**
 * Gets a better formatted token error for displaying to a user.
 * @param {error} error The token error that occurred.
 * @param {Request} req The THe request object.
 */
function getPrettyTokenErrorMessage(error, req) {
  if (_.isNil(error.name)) return error.message;

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  switch (name) {
    case 'tokenexpirederror':
      return languageService.get(req, 'error.token_session_expired');
    case 'jsonwebtokenerror':
      break;
    default:
  }

  switch (message) {
    case 'jwt malformed':
      return languageService.get(req, 'error.token_malformed');
    case 'jwt signature is required':
    case 'invalid signature':
      return languageService.get(req, 'error.invalid_missing_signature');
    default:
      return `${languageService.get(req, 'error.failed_token_validation')} Error: ${name}, ${message}`;
  }
}

module.exports = {
  saltAndHash,
  comparePasswords,
  signAuthenticationToken,
  validateAuthenticationToken,
  getPrettyTokenErrorMessage,
  parseJwt
};
