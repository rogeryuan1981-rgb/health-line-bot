import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

// 您的 LINE 憑證
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
            // ✅ 修正 1：非文字訊息路徑明確回傳 null
            if (event.type !== "message" || event.message.type !== "text") {
                return null;
            }

            const userMessage = event.message.text;
            const snapshot = await db.collection("flowRules").where("nodeName", "==", userMessage).limit(1).get();

            // ✅ 修正 2：找不到關鍵字路徑明確回傳 null
            if (snapshot.empty) {
                return null;
            }

            const data = snapshot.docs[0].data();
            const imageAspectRatio = data.imageAspectRatio || 'rectangle';
            let reply: line.Message;

            // 根據 messageType 組合 LINE 訊息
            switch (data.messageType) {
                case "video":
                    reply = {
                        type: "template",
                        altText: "影音教學已送達",
                        template: {
                            type: "buttons",
                            imageAspectRatio: imageAspectRatio as 'rectangle' | 'square',
                            thumbnailImageUrl: data.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                            title: data.videoTitle || "影片教學",
                            text: "點擊下方按鈕觀看內容",
                            actions: [{ type: "uri", label: "📺 觀看影片", uri: data.videoUrl || "https://youtube.com" }]
                        }
                    };
                    break;

                case "image":
                    reply = {
                        type: "image",
                        originalContentUrl: data.imageUrl || "https://via.placeholder.com/800",
                        previewImageUrl: data.imageUrl || "https://via.placeholder.com/800"
                    };
                    break;

                case "carousel":
                    reply = {
                        type: "flex",
                        altText: "資訊清單已送達",
                        contents: {
                            type: "carousel",
                            contents: (data.cards || []).map((card: any) => ({
                                type: "bubble",
                                size: data.cardSize === 'sm' ? "micro" : "mega",
                                hero: {
                                    type: "image",
                                    url: card.imageUrl || "https://via.placeholder.com/800",
                                    size: "full",
                                    aspectRatio: imageAspectRatio === 'square' ? "1:1" : "20:13",
                                    aspectMode: "cover"
                                },
                                body: {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                        { type: "text", text: card.title || "品名", weight: "bold", size: "sm" },
                                        { type: "text", text: card.price || "", size: "xs", color: "#ff0000", weight: "bold", margin: "sm" }
                                    ]
                                },
                                footer: {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [{
                                        type: "button",
                                        style: "primary",
                                        color: "#06C755",
                                        action: { type: "message", label: "選擇", text: card.title }
                                    }]
                                }
                            }))
                        }
                    };
                    break;

                case "text":
                default:
                    reply = { type: "text", text: data.textContent || "無設定回覆內容" };
                    break;
            }

            // ✅ 修正 3：確保最後回傳的是 replyMessage 的結果
            return client.replyMessage(event.replyToken, reply);
        }));

        res.status(200).send("OK");
    } catch (err) {
        console.error("Webhook 錯誤:", err);
        res.status(500).send("Internal Server Error");
    }
};
