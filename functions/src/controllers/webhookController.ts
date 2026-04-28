import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

const client = new line.Client({
    channelAccessToken: "AYVtEDZdBNI2Uzy+4zu1+FhNHZ7Ly4b6v69Hz2swC3ntdpS+3vdLcMZmescCUSPCIwcPpeBw7UvJKEjsgRqBm8SJ1k4JFDfhUlCZ+ta/12fnVxs+Nrlcbg2sX/Tvkxj3ARK4kpd0myiKqEWLTL0ApgdB04t89/1O/w1cDnyilFU=",
    channelSecret: "14c91b3caaa31d8583e3175dfb9c052f"
});

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const events = req.body.events;
        if (!events || events.length === 0) return res.status(200).send("OK");

        await Promise.all(events.map(async (event: any) => {
            if (event.type !== "message" || event.message.type !== "text") return null;

            const userMessage = event.message.text;
            const snapshot = await db.collection("flowRules").where("nodeName", "==", userMessage).limit(1).get();

            if (snapshot.empty) return null;

            const data = snapshot.docs[0].data();
            let reply: line.Message;

            // 👉 處理 Carousel (輪播卡片) 邏輯
            if (data.messageType === 'carousel' && data.cards?.length > 0) {
                reply = {
                    type: "template",
                    altText: "請查看多樣化選單",
                    template: {
                        type: "carousel",
                        columns: data.cards.map((card: any) => ({
                            thumbnailImageUrl: card.imageUrl || "https://via.placeholder.com/800",
                            title: card.title || "未命名卡片",
                            text: card.description || "點擊下方按鈕進行下一步",
                            actions: (card.buttons || []).slice(0, 3).map((btn: any) => ({
                                type: "message",
                                label: btn.label || "了解更多",
                                text: btn.target || "無效目標"
                            }))
                        }))
                    }
                };
            } else {
                // 原有的單一卡片處理邏輯 (Video/Image/Text)
                // ... (保持原本穩定運行的邏輯) ...
                reply = { type: "text", text: data.textContent || "內容未設定" };
            }

            return client.replyMessage(event.replyToken, reply);
        }));
        res.status(200).send("OK");
    } catch (err) { res.status(500).send("Error"); }
};
