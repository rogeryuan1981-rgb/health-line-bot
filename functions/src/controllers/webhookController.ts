import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

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

        await Promise.all(
            events.map(async (event: line.WebhookEvent) => {
                if (event.type !== "message" || event.message.type !== "text") {
                    return Promise.resolve(null);
                }

                const userMessage = event.message.text;
                const snapshot = await db.collection("flowRules").where("nodeName", "==", userMessage).limit(1).get();

                let replyMessage: line.Message;

                if (snapshot.empty) {
                    replyMessage = {
                        type: "text",
                        text: `您好，尚未設定「${userMessage}」的回覆流程。`
                    };
                } else {
                    const nodeData = snapshot.docs[0].data();
                    
                    if (nodeData.messageType === "video" && nodeData.videoUrl) {
                        // 回傳 LINE 影片卡片範本
                        replyMessage = {
                            type: "template",
                            altText: `影音教學：${nodeData.videoTitle || '請看影片'}`,
                            template: {
                                type: "buttons",
                                thumbnailImageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                                title: nodeData.videoTitle || "教學影片",
                                text: "點擊下方按鈕觀看完整內容",
                                actions: [
                                    {
                                        type: "uri",
                                        label: "立刻觀看",
                                        uri: nodeData.videoUrl
                                    }
                                ]
                            }
                        };
                    } else {
                        replyMessage = {
                            type: "text",
                            text: `偵測到關鍵字：${nodeData.nodeName}\n目前設定為純文字回覆。`
                        };
                    }
                }

                return client.replyMessage(event.replyToken, replyMessage);
            })
        );

        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook 錯誤:", error);
        res.status(500).send("Error");
    }
};
