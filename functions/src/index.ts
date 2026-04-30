import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { handleWebhook } from "./controllers/webhookController";

// 只有在還沒開機的情況下才執行開機
if (!admin.apps.length) {
    admin.initializeApp();
}

// 設定在台灣機房 (asia-east1) 執行
export const webhook = onRequest({ region: "asia-east1" }, async (req, res) => {
    await handleWebhook(req, res);
});
