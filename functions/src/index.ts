import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// 假設您已經初始化 admin.initializeApp()

export const lineWebhook = functions.https.onRequest(async (req, res) => {
  const events = req.body.events;

  if (!events || events.length === 0) {
    res.status(200).send("OK");
    return;
  }

  const db = admin.firestore();

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    const userText = event.message.text.trim();
    let targetRule: any = null;

    try {
      // 👉 核心邏輯：讀取所有規則進行多重比對
      const rulesSnap = await db.collection("flowRules").get();
      const allRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 1. 優先尋找精準比對 (包含逗號分隔的多關鍵字)
      targetRule = allRules.find((rule: any) => {
        const keywords = (rule.nodeName || "").split(",").map((k: string) => k.trim());
        return keywords.includes(userText);
      });

      // 2. 如果沒對中，尋找萬用字元比對 (例如: 謝*)
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => {
          const nodeName = rule.nodeName || "";
          if (nodeName.includes("*")) {
            // 將星號轉為正則表達式的萬用字元
            const pattern = "^" + nodeName.split("*").join(".*") + "$";
            const regex = new RegExp(pattern);
            return regex.test(userText);
          }
          return false;
        });
      }

      // 3. 最後如果還是沒對中，尋找「預設回覆」
      if (!targetRule) {
        targetRule = allRules.find((rule: any) => rule.nodeName === "預設回覆");
      }

      if (targetRule) {
        // 此處實作您的回覆邏輯 (client.replyMessage)
        // 根據 targetRule.messageType 發送 text, image, flex 等
        console.log(`命中規則: ${targetRule.nodeName}`);
      }

    } catch (error) {
      console.error("Webhook Error:", error);
    }
  }

  res.status(200).send("OK");
});
