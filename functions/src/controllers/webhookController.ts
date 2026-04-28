import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();
const client = new line.Client({ 
    channelAccessToken: "YOUR_CHANNEL_ACCESS_TOKEN", 
    channelSecret: "YOUR_CHANNEL_SECRET" 
});

export const handleWebhook = async (req: Request, res: Response) => {
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send("OK");

    await Promise.all(events.map(async (event: any) => {
        let targetNodeData: any = null;

        // 1. 處理「文字訊息」觸發 (依據關鍵字)
        if (event.type === "message" && event.message.type === "text") {
            const snap = await db.collection("flowRules").where("nodeName", "==", event.message.text).limit(1).get();
            if (!snap.empty) targetNodeData = snap.docs[0].data();
        }

        // 2. 處理「Postback」觸發 (依據下一層 ID，不洗版對話)
        if (event.type === "postback") {
            const nodeId = event.postback.data;
            const doc = await db.collection("flowRules").doc(nodeId).get();
            if (doc.exists) targetNodeData = doc.data();
        }

        if (!targetNodeData) return null;

        const data = targetNodeData;
        const aspect = data.imageAspectRatio === 'square' ? "1:1" : "20:13";
        let reply: line.Message;

        // 根據配置決定回覆內容
        switch (data.messageType) {
            case "image":
                reply = { type: "image", originalContentUrl: data.imageUrl, previewImageUrl: data.imageUrl };
                break;
            case "video":
                reply = {
                    type: "template", altText: "影音內容",
                    template: {
                        type: "buttons", thumbnailImageUrl: data.imageUrl, imageAspectRatio: data.imageAspectRatio || "rectangle",
                        title: data.videoTitle, text: "點擊按鈕觀看",
                        actions: [{ type: "uri", label: "📺 觀看影片", uri: data.videoUrl }]
                    }
                };
                break;
            case "carousel":
                reply = {
                    type: "flex", altText: "請選擇項目",
                    contents: {
                        type: "carousel",
                        contents: (data.cards || []).map((card: any) => ({
                            type: "bubble",
                            size: data.cardSize === 'sm' ? "micro" : "mega",
                            hero: { type: "image", url: card.imageUrl, size: "full", aspectRatio: aspect, aspectMode: "cover" },
                            body: { type: "box", layout: "vertical", contents: [
                                { type: "text", text: card.title || "標題", weight: "bold", size: "sm" },
                                { type: "text", text: card.price || "", size: "xs", color: "#ff0000", margin: "sm" }
                            ]},
                            footer: { type: "box", layout: "vertical", contents: [
                                { 
                                    type: "button", style: "primary", color: "#06C755", 
                                    // 這裡是關鍵：將按鈕動作設為下一步觸發
                                    action: { type: "message", label: "選擇", text: card.title } 
                                }
                            ]}
                        }))
                    }
                };
                break;
            default:
                reply = { type: "text", text: data.textContent || "無設定內容" };
        }

        return client.replyMessage(event.replyToken, reply);
    }));
    res.status(200).send("OK");
};
