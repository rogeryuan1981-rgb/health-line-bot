import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

const config = {
    channelAccessToken: "AYVtEDZdBNI2Uzy+4zu1+FhNHZ7Ly4b6v69Hz2swC3ntdpS+3vdLcMZmescCUSPCIwcPpeBw7UvJKEjsgRqBm8SJ1k4JFDfhUlCZ+ta/12fnVxs+Nrlcbg2sX/Tvkxj3ARK4kpd0myiKqEWLTL0ApgdB04t89/1O/w1cDnyilFU=",
    channelSecret: "14c91b3caaa31d8583e3175dfb9c052f"
};

const client = new line.Client(config);

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const events = req.body.events;
        if (!events || events.length === 0) return res.status(200).send("OK");

        await Promise.all(events.map(async (event: any) => {
            if (event.type !== "message" || event.message.type !== "text") return;

            const userMessage = event.message.text;
            const snapshot = await db.collection("flowRules").where("nodeName", "==", userMessage).limit(1).get();

            if (snapshot.empty) return;

            const data = snapshot.docs[0].data();
            
            // 👉 動態解析按鈕陣列
            const actions: any[] = (data.buttons || []).map((btn: any) => ({
                type: "message",
                label: btn.label || "未命名按鈕",
                text: btn.target || "無效觸發"
            }));

            let reply: line.Message;

            // 如果有按鈕，使用模板訊息
            if (actions.length > 0) {
                reply = {
                    type: "template",
                    altText: "請查看選單內容",
                    template: {
                        type: "buttons",
                        thumbnailImageUrl: data.messageType === 'image' ? data.imageUrl : undefined,
                        title: data.messageType === 'video' ? data.videoTitle : undefined,
                        text: data.textContent || `您選擇了：${data.nodeName}\n請點擊下方按鈕：`,
                        actions: actions.slice(0, 4) // LINE Buttons Template 限制最多 4 個，如果要 5 個以上需改用 Carousel
                    }
                };
            } else {
                // 處理純影片或圖片
                if (data.messageType === 'video') {
                    reply = { type: "text", text: `影片連結：${data.videoUrl}` };
                } else if (data.messageType === 'image') {
                    reply = { type: "image", originalContentUrl: data.imageUrl, previewImageUrl: data.imageUrl };
                } else {
                    reply = { type: "text", text: data.textContent || "內容為空" };
                }
            }

            return client.replyMessage(event.replyToken, reply);
        }));

        res.status(200).send("OK");
    } catch (err) { res.status(500).send("Error"); }
};
