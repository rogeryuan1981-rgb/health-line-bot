import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// 初始化 Firebase Admin (如果尚未初始化)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const lineWebhook = functions.https.onRequest(async (req, res) => {
  const events = req.body.events;

  // 基本檢查
  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    // 只處理文字訊息
    if (event.type !== "message" || event.message.type !== "text") continue;

    const userText = event.message.text.trim();
    let targetRule: any = null;

    try {
      // 1. 抓取所有流程規則
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. 執行「多關鍵字匹配」邏輯 (不含萬用字元)
      targetRule = allRules.find((rule: any) => {
        const nodeName = rule.nodeName || "";
        
        // 將節點名稱按英文逗號「,」或中文逗號「，」拆分成陣列
        const keywords = nodeName.split(/,|，/).map((k: string) => k.trim());
        
        // 檢查用戶輸入的文字是否完全符合陣列中的任一項
        return keywords.includes(userText);
      });

      // 3. 如果沒對中，尋找「預設回覆」節點作為保底
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
      }

      // 4. 執行回覆動作
      if (targetRule) {
        // 這裡銜接您原本的 LINE SDK replyMessage 邏輯
        // 根據 targetRule.messageType (text/image/flex...) 組裝訊息並發送
        console.log(`成功匹配關鍵字: ${userText} -> 節點: ${targetRule.nodeName}`);
      }

    } catch (error) {
      console.error("Webhook 處理錯誤:", error);
    }
  }

  res.status(200).send("OK");
});
