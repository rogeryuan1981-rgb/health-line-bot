import { onRequest } from "firebase-functions/v2/https"; // 👉 使用 v2 的導入方式
import * as admin from "firebase-admin";
import axios from "axios";

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * LINE Webhook 核心處理函式 (v2)
 * 設定部署區域為 asia-east1 (台灣)
 */
export const lineWebhook = onRequest({ region: "asia-east1" }, async (req, res) => {
  // 1. 安全讀取環境變數 (v2 依然支援從 config 讀取，但建議確保已設定)
  // 若使用 v2 secrets 也可以，此處維持 config 寫法以兼容你之前的設定
  const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || ""; 

  const events = req.body.events;

  // 基本檢查
  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    // 僅處理「文字訊息」
    if (event.type !== "message" || event.message.type !== "text" || !event.replyToken) continue;

    const userText = event.message.text.trim();
    const replyToken = event.replyToken;
    let targetRule: any = null;

    try {
      // 2. 抓取流程規則
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. 多關鍵字比對 (修正逗號與空白問題)
      targetRule = allRules.find((rule: any) => {
        const nodeName = rule.nodeName || "";
        const keywords = nodeName.split(/,|，/).map((k: string) => k.trim()).filter(Boolean);
        return keywords.includes(userText);
      });

      // 4. 保底邏輯：預設回覆
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
      }

      // 5. 封裝訊息
      if (targetRule) {
        let messages: any[] = [];

        switch (targetRule.messageType) {
          case 'text':
            messages = [{
              type: 'text',
              text: targetRule.textContent || "收到，請稍候。"
            }];
            break;

          case 'image':
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
              fileName: targetRule.textContent || "下載檔案",
              fileUrl: targetRule.fileUrl
            }];
            break;

          case 'flex':
          case 'carousel':
            messages = [{
              type: 'flex',
              altText: '您有新訊息',
              contents: targetRule.flexData || {} 
            }];
            break;

          default:
            messages = [{ type: 'text', text: "訊息已收到" }];
        }

        // 6. 發送 API 請求
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
                Authorization: `Bearer ${LINE_ACCESS_TOKEN}`, // 👉 這裡請確保 Token 正確
              },
            }
          );
          console.log(`✅ 成功比對並回覆: [${userText}]`);
        }
      }

    } catch (error: any) {
      console.error("❌ Webhook Error:", error.response?.data || error.message);
    }
  }

  res.status(200).send("OK");
});
