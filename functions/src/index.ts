import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// 初始化 Firebase Admin SDK，讓我們後續可以讀寫 Firestore 資料庫裡的預防保健懶人包資料
admin.initializeApp();

// 引入處理 LINE 訊息的核心邏輯 (下一個步驟會建立)
import { handleLineWebhook } from './controllers/webhookController';

// 建立一個 HTTP 函數作為 LINE 的 Webhook 網址
// 選擇 asia-east1 區域可以讓台灣的 LINE 伺服器連線延遲降到最低
export const webhook = functions.region('asia-east1').https.onRequest(async (req, res) => {
  try {
    // 將收到的請求轉交給我們的控制器處理
    await handleLineWebhook(req, res);
  } catch (error) {
    console.error('Webhook 處理過程中發生錯誤:', error);
    // 即使發生錯誤，也必須回傳 200 給 LINE，否則 LINE 會判定我們的伺服器死機並重複發送訊息
    res.status(200).send('Error but resolved');
  }
});
