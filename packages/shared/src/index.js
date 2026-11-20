"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY_SYMBOL = exports.CURRENCY_CODE = exports.APP_TAGLINE = exports.APP_NAME = void 0;
__exportStar(require("./enums"), exports);
__exportStar(require("./money"), exports);
__exportStar(require("./date"), exports);
__exportStar(require("./schemas"), exports);
exports.APP_NAME = 'SiteFlow';
exports.APP_TAGLINE = 'Construction Site Manager';
exports.CURRENCY_CODE = 'INR';
exports.CURRENCY_SYMBOL = '₹';
//# sourceMappingURL=index.js.map