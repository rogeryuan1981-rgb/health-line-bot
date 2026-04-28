import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
// 確保路徑與您的檔案結構一致
import { handleWebhook } from "./controllers/webhookController"; 

admin.initializeApp();

// 新版 v2 的寫法：將 region 放在設定物件中
export const webhook = onRequest({ region: "asia-east1" }, async (req, res) => {
    await handleWebhook(req, res);
});
