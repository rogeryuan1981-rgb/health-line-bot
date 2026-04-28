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

            if (snapshot.empty) return; // 找不到關鍵字就不回覆，或可改為回覆預設訊息

            const data = snapshot.docs[0].data();
            let reply: line.Message;

            // 1. 準備按鈕 (如果有設定的話)
            const actions: any[] = (data.buttons || []).map((btn: any) => ({
                type: "message",
                label: btn.label || "未命名按鈕",
                text: btn.target || "無效目標"
            }));

            // 2. 根據設定的類型 (messageType) 來決定回覆格式
            switch (data.messageType) {
                case "video":
                    // 影片一律使用 Buttons Template，確保有卡片感
                    const videoActions = [...actions];
                    // 如果有影片網址，強制在最前面加一個「觀看影片」按鈕
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
                            actions: videoActions.slice(0, 4) // LINE 限制最多 4 個
                        }
                    };
                    break;

                case "image":
                    if (actions.length > 0) {
                        // 有按鈕時，使用帶圖的 Buttons Template
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
                        // 沒按鈕時，發送純圖片
                        reply = {
                            type: "image",
                            originalContentUrl: data.imageUrl || "https://via.placeholder.com/800",
                            previewImageUrl: data.imageUrl || "https://via.placeholder.com/800"
                        };
                    }
                    break;

                case "text":
                default:
                    if (actions.length > 0) {
                        // 有按鈕時，發送文字選單卡片
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
                        // 沒按鈕時，純文字回覆
                        reply = { type: "text", text: data.textContent || "內容未設定" };
                    }
                    break;
            }

            return client.replyMessage(event.replyToken, reply);
        }));

        res.status(200).send("OK");
    } catch (err) { 
        console.error("Webhook Error:", err);
        res.status(500).send("Error"); 
    }
};
