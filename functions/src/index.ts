import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Client } from "@line/bot-sdk";

// ⚠️ 請務必確認填入正確的憑證
const lineConfig = {
  channelAccessToken: "您的_CHANNEL_ACCESS_TOKEN",
  channelSecret: "您的_CHANNEL_SECRET"
};

const client = new Client(lineConfig);

if (!admin.apps.length) {
  admin.initializeApp();
}

export const lineWebhook = functions.https.onRequest(async (req, res) => {
  const events = req.body.events;

  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    // 1. 取得用戶訊息並徹底去空白
    const userText = event.message.text.trim();
    const replyToken = event.replyToken;
    let targetRule: any = null;

    try {
      // 2. 抓取所有流程規則
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. 🔍 核心防呆比對邏輯
      targetRule = allRules.find((rule: any) => {
        const nodeName = rule.nodeName || "";
        
        // 👉 防呆機制：同時切割中英文逗號、換行符號，並對每個詞做 .trim() 去空格
        const keywords = nodeName
          .split(/[,，\n]/) 
          .map((k: string) => k.trim()) 
          .filter((k: string) => k !== ""); // 過濾掉空字串
        
        // 在日誌中檢查拆分後的結果
        console.log(`[比對中] 節點名稱: ${nodeName} -> 拆解後清單:`, keywords);
        
        return keywords.includes(userText);
      });

      // 4. 若沒對中，抓取「預設回覆」
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
        console.log("⚠️ 未匹配任何關鍵字，使用預設回覆");
      }

      // 5. 🚀 執行發送訊息
      if (targetRule && replyToken) {
        let responseMessage: any = null;

        // 依據畫布設定的 messageType 組裝訊息
        switch (targetRule.messageType) {
          case 'text':
            responseMessage = { type: 'text', text: targetRule.textContent || "系統忙碌中" };
            break;
          case 'image':
            const urls = targetRule.imageUrls?.length > 0 ? targetRule.imageUrls : [targetRule.imageUrl];
            responseMessage = urls.filter((u: string) => u).map((u: string) => ({
              type: 'image', originalContentUrl: u, previewImageUrl: u
            }));
            break;
          case 'video':
            responseMessage = {
              type: 'video',
              originalContentUrl: targetRule.videoUrl,
              previewImageUrl: targetRule.imageUrl
            };
            break;
          case 'file':
            responseMessage = {
              type: 'file',
              fileName: targetRule.textContent || "下載檔案",
              fileUrl: targetRule.fileUrl
            };
            break;
          case 'flex':
          case 'carousel':
            // 假設 targetRule.flexData 已經是合規的 JSON 物件
            responseMessage = {
              type: 'flex',
              altText: '您有新訊息',
              contents: targetRule.flexData || {} 
            };
            break;
        }

        if (responseMessage) {
          await client.replyMessage(replyToken, responseMessage);
          console.log(`🎯 成功回覆用戶 [${userText}]`);
        }
      }

    } catch (error) {
      console.error("❌ Webhook 執行錯誤:", error);
    }
  }

  res.status(200).send("OK");
});
