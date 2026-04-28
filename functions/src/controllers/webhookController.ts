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

            if (snapshot.empty) {
                return client.replyMessage(event.replyToken, { type: "text", text: `未設定「${userMessage}」的回覆。` });
            }

            const data = snapshot.docs[0].data();
            let reply: line.Message;

            // 根據資料庫儲存的類型來決定回覆格式
            switch (data.messageType) {
                case "video":
                    reply = {
                        type: "template",
                        altText: `觀看影片：${data.videoTitle}`,
                        template: {
                            type: "buttons",
                            thumbnailImageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                            title: data.videoTitle || "教學影片",
                            text: "點擊下方連結開始觀看",
                            actions: [{ type: "uri", label: "立刻觀看", uri: data.videoUrl || "https://youtube.com" }]
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
                case "text":
                default:
                    reply = { type: "text", text: data.textContent || "無預設文字內容" };
                    break;
            }

            return client.replyMessage(event.replyToken, reply);
        }));

        res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};
