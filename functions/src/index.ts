import { onRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions"; // 👉 為了讀取 config 必須導入
import * as admin from "firebase-admin";
import axios from "axios";

// 1. 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * LINE Webhook 核心處理函式 (原名 webhook)
 * 部署區域：asia-east1
 */
export const webhook = onRequest({ 
  region: "asia-east1",
  maxInstances: 10 
}, async (req, res) => {
  
  // 2. 🚀 修正：改回使用 functions.config() 讀取憑證
  // 請確保你執行過：firebase functions:config:set line.access_token="你的TOKEN"
  const config = functions.config();
  const LINE_ACCESS_TOKEN = config.line ? config.line.access_token : ""; 

  const events = req.body.events;

  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text" || !event.replyToken) continue;

    const userText = event.message.text.trim();
    const replyToken = event.replyToken;
    let targetRule: any = null;

    try {
      // 3. 抓取流程規則
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 4. 多關鍵字匹配
      targetRule = allRules.find((rule: any) => {
        const nodeName = rule.nodeName || "";
        const keywords = nodeName.split(/[,，\n]/).map((k: string) => k.trim()).filter(Boolean);
        return keywords.includes(userText);
      });

      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
      }

      // 5. 執行回覆動作
      if (targetRule && replyToken) {
        let messages: any[] = [];

        switch (targetRule.messageType) {
          case 'text':
            messages = [{ type: 'text', text: targetRule.textContent || "收到，請稍候。" }];
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

        // 6. 發送回覆 (帶上正確的 Authorization Header)
        if (messages.length > 0 && LINE_ACCESS_TOKEN) {
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
          console.log(`✅ 成功回覆: [${userText}]`);
        } else if (!LINE_ACCESS_TOKEN) {
          console.error("❌ 錯誤：找不到 LINE_ACCESS_TOKEN，請檢查 Firebase Config 設定。");
        }
      }

    } catch (error: any) {
      console.error("❌ Webhook Error:", error.response?.data || error.message);
    }
  }

  res.status(200).send("OK");
});
