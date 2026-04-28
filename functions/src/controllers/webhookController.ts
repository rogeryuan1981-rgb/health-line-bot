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
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send("OK");

    await Promise.all(events.map(async (event: any) => {
        if (event.type !== "message" || event.message.type !== "text") return null;

        const snap = await db.collection("flowRules").where("nodeName", "==", event.message.text).limit(1).get();
        if (snap.empty) return null;

        const data = snap.docs[0].data();
        let reply: line.Message;

        const imageAspectRatio = data.imageAspectRatio || 'rectangle';

        switch (data.messageType) {
            case "video":
                reply = {
                    type: "template", altText: "影音教學",
                    template: {
                        type: "buttons", imageAspectRatio,
                        thumbnailImageUrl: data.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                        title: data.videoTitle || "影片教學", text: "點擊按鈕觀看內容",
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
                    type: "flex", altText: "資訊清單",
                    contents: {
                        type: "carousel",
                        contents: (data.cards || []).map((card: any) => ({
                            type: "bubble",
                            size: data.cardSize === 'sm' ? "micro" : "mega",
                            hero: { type: "image", url: card.imageUrl || "https://via.placeholder.com/800", size: "full", aspectRatio: imageAspectRatio === 'square' ? "1:1" : "20:13", aspectMode: "cover" },
                            body: { type: "box", layout: "vertical", contents: [{ type: "text", text: card.title || "品名", weight: "bold", size: "sm" }] },
                            footer: { type: "box", layout: "vertical", contents: [{ type: "button", style: "primary", color: "#06C755", action: { type: "message", label: "選擇", text: card.title } }] }
                        }))
                    }
                };
                break;

            case "text":
            default:
                reply = { type: "text", text: data.textContent || "無設定內容" };
                break;
        }

        return client.replyMessage(event.replyToken, reply);
    }));
    res.status(200).send("OK");
};
