"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.hashPin = hashPin;
exports.comparePin = comparePin;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
}
async function comparePassword(password, hash) {
    return bcrypt_1.default.compare(password, hash);
}
async function hashPin(pin) {
    return bcrypt_1.default.hash(pin, SALT_ROUNDS);
}
async function comparePin(pin, hash) {
    return bcrypt_1.default.compare(pin, hash);
}
//# sourceMappingURL=hash.js.map