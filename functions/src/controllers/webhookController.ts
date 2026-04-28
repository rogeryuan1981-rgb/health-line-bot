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
        if (!events || events.length === 0) {
            res.status(200).send("OK");
            return;
        }

        await Promise.all(events.map(async (event: any) => {
            // 修正 1: 過濾非文字訊息時，必須明確回傳 null
            if (event.type !== "message" || event.message.type !== "text") {
                return null;
            }

            const userMessage = event.message.text;
            const snapshot = await db.collection("flowRules").where("nodeName", "==", userMessage).limit(1).get();

            // 修正 2: 找不到關鍵字時，發送預設訊息後也要 return
            if (snapshot.empty) {
                await client.replyMessage(event.replyToken, { 
                    type: "text", 
                    text: `抱歉，我還沒學會如何回應「${userMessage}」，請到後台設定喔！` 
                });
                return null;
            }

            const data = snapshot.docs[0].data();
            let reply: line.Message;

            // 準備按鈕
            const actions: any[] = (data.buttons || []).map((btn: any) => ({
                type: "message",
                label: btn.label || "未命名按鈕",
                text: btn.target || "無效目標"
            }));

            // 根據 messageType 組合 LINE 訊息
            switch (data.messageType) {
                case "video":
                    const videoActions = [...actions];
                    if (data.videoUrl) {
                        videoActions.unshift({ type: "uri", label: "📺 觀看教學影片", uri: data.videoUrl });
                    }
                    reply = {
                        type: "template",
                        altText: `影音教學：${data.videoTitle || '點擊觀看'}`,
                        template: {
                            type: "buttons",
                            thumbnailImageUrl: data.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                            title: data.videoTitle || "教學影片",
                            text: "請選擇下方操作繼續：",
                            actions: videoActions.slice(0, 4)
                        }
                    };
                    break;

                case "image":
                    if (actions.length > 0) {
                        reply = {
                            type: "template",
                            altText: "請查看圖片說明",
                            template: {
                                type: "buttons",
                                thumbnailImageUrl: data.imageUrl || "https://via.placeholder.com/800",
                                text: data.textContent || "點擊下方按鈕：",
                                actions: actions.slice(0, 4)
                            }
                        };
                    } else {
                        reply = {
                            type: "image",
                            originalContentUrl: data.imageUrl || "https://via.placeholder.com/800",
                            previewImageUrl: data.imageUrl || "https://via.placeholder.com/800"
                        };
                    }
                    break;

                default: // 'text'
                    if (actions.length > 0) {
                        reply = {
                            type: "template",
                            altText: "請選擇下一步",
                            template: {
                                type: "buttons",
                                text: data.textContent || "請選擇：",
                                actions: actions.slice(0, 4)
                            }
                        };
                    } else {
                        reply = { type: "text", text: data.textContent || "內容未設定" };
                    }
                    break;
            }

            // 修正 3: 確保這裡有 return 回覆操作的結果
            return client.replyMessage(event.replyToken, reply);
        }));

        res.status(200).send("OK");
    } catch (err) { 
        console.error("Webhook Error:", err);
        res.status(500).send("Error"); 
    }
};
