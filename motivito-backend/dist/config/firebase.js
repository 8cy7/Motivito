"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFirebase = initFirebase;
exports.getFirebaseAdmin = getFirebaseAdmin;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("./env");
let firebaseApp = null;
function initFirebase() {
    if (!env_1.env.FIREBASE_PROJECT_ID || !env_1.env.FIREBASE_PRIVATE_KEY || !env_1.env.FIREBASE_CLIENT_EMAIL) {
        console.warn('⚠️ Firebase not configured - FCM notifications disabled');
        return;
    }
    if (firebase_admin_1.default.apps.length === 0) {
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: env_1.env.FIREBASE_PROJECT_ID,
                privateKey: env_1.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log('✅ Firebase Admin initialized');
    }
}
function getFirebaseAdmin() {
    return firebaseApp ? firebase_admin_1.default : null;
}
//# sourceMappingURL=firebase.js.map