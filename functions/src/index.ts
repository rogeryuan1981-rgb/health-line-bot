import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";

// 1. 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * LINE Webhook 核心處理函式 (維持原名 webhook)
 * 設定部署區域為 asia-east1 (台灣)
 */
export const webhook = onRequest({ 
  region: "asia-east1",
  maxInstances: 10 
}, async (req, res) => {
  
  // 2. 讀取環境變數 (確保你已設定 LINE_ACCESS_TOKEN)
  const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || ""; 

  const events = req.body.events;

  // 基本檢查：若無事件則回傳 200 並結束
  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    // 僅處理「文字訊息」且具備回覆權杖
    if (event.type !== "message" || event.message.type !== "text" || !event.replyToken) continue;

    const userText = event.message.text.trim();
    const replyToken = event.replyToken;
    let targetRule: any = null;

    try {
      // 3. 抓取所有流程規則 (flowRules)
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 4. 🚀 多關鍵字匹配邏輯 (不含萬用字元，支援逗號拆分)
      targetRule = allRules.find((rule: any) => {
        const nodeName = rule.nodeName || "";
        // 支援中英文逗號，並清理每個詞的前後空白與換行
        const keywords = nodeName.split(/[,，\n]/).map((k: string) => k.trim()).filter(Boolean);
        return keywords.includes(userText);
      });

      // 5. 若未命中，則尋找「預設回覆」
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
      }

      // 6. 封裝並發送回覆
      if (targetRule && replyToken) {
        let messages: any[] = [];

        switch (targetRule.messageType) {
          case 'text':
            messages = [{
              type: 'text',
              text: targetRule.textContent || "收到訊息，請稍候。"
            }];
            break;

          case 'image':
            // 支援 1~5 張多圖連發
            const images = (targetRule.imageUrls && targetRule.imageUrls.length > 0)
              ? targetRule.imageUrls
              : [targetRule.imageUrl];
            
            messages = images.filter((u: string) => u).slice(0, 5).map((u: string) => ({
              type: 'image',
              originalContentUrl: u,
              previewImageUrl: u
            }));
            break;

          case 'video':
            messages = [{
              type: 'video',
              originalContentUrl: targetRule.videoUrl,
              previewImageUrl: targetRule.imageUrl || targetRule.videoUrl
            }];
            break;

          case 'file':
            messages = [{
              type: 'file',
              fileName: targetRule.textContent || "檔案下載",
              fileUrl: targetRule.fileUrl
            }];
            break;

          case 'flex':
          case 'carousel':
            messages = [{
              type: 'flex',
              altText: '您有一則新訊息',
              contents: targetRule.flexData || {} 
            }];
            break;

          default:
            messages = [{ type: 'text', text: "已收到您的訊息。" }];
        }

        // 7. 透過 Axios 呼叫 LINE API
        if (messages.length > 0) {
          await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            {
              replyToken: replyToken,
              messages: messages
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
              },
            }
          );
          console.log(`✅ 成功比對關鍵字 [${userText}] -> 觸發節點: ${targetRule.nodeName}`);
        }
      }

    } catch (error: any) {
      console.error("❌ Webhook Error:", error.response?.data || error.message);
    }
  }

  // 必須回傳 200 給 LINE，否則會重複發送
  res.status(200).send("OK");
});
