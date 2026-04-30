import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * LINE Webhook 核心處理函式
 * 部署區域：asia-east1 (台灣)
 */
export const lineWebhook = functions.region("asia-east1").https.onRequest(async (req, res) => {
  // 從 Firebase Config 安全讀取憑證，不寫死在程式碼中
  const LINE_ACCESS_TOKEN = functions.config().line.access_token;

  const events = req.body.events;

  // 1. 基本檢查：若無事件則直接結束
  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    // 僅處理「文字訊息」且具備回覆權杖的事件
    if (event.type !== "message" || event.message.type !== "text" || !event.replyToken) continue;

    const userText = event.message.text.trim();
    const replyToken = event.replyToken;
    let targetRule: any = null;

    try {
      // 2. 從 Firestore 抓取所有流程規則 (flowRules)
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. 執行「多關鍵字匹配」邏輯
      // 將 nodeName 按逗號拆分並移除前後空格後進行包含比對
      targetRule = allRules.find((rule: any) => {
        const nodeName = rule.nodeName || "";
        const keywords = nodeName.split(/,|，/).map((k: string) => k.trim()).filter(Boolean);
        return keywords.includes(userText);
      });

      // 4. 若未命中任何關鍵字，尋找名為「預設回覆」的保底節點
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
      }

      // 5. 封裝並發送 LINE 訊息
      if (targetRule) {
        let messages: any[] = [];

        switch (targetRule.messageType) {
          case 'text':
            messages = [{
              type: 'text',
              text: targetRule.textContent || "收到您的訊息，請稍候。"
            }];
            break;

          case 'image':
            // 支援多圖連發 (優先使用 imageUrls 陣列，若無則使用單一 imageUrl)
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
              previewImageUrl: targetRule.imageUrl || targetRule.videoUrl // 若無封面則用影片網址嘗試
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
            // 處理 Flex Message
            messages = [{
              type: 'flex',
              altText: '您有一則新訊息',
              contents: targetRule.flexData || {} 
            }];
            break;

          default:
            messages = [{ type: 'text', text: "收到您的訊息！" }];
        }

        // 6. 透過 Axios 呼叫 LINE Reply API
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
          console.log(`✅ 匹配成功：用戶輸入 [${userText}] -> 觸發節點 [${targetRule.nodeName}]`);
        }
      } else {
        console.log(`⚠️ 無匹配規則且無預設回覆：[${userText}]`);
      }

    } catch (error: any) {
      // 詳細記錄錯誤日誌以利排錯
      console.error("❌ Webhook 發生錯誤：", error.response?.data || error.message);
    }
  }

  // 必須回傳 200 OK 給 LINE Server，否則 LINE 會認定 Webhook 失敗並重複發送
  res.status(200).send("OK");
});
