import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();
const client = new line.Client({ channelAccessToken: "YOUR_TOKEN", channelSecret: "YOUR_SECRET" });

export const handleWebhook = async (req: Request, res: Response) => {
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send("OK");

    await Promise.all(events.map(async (event: any) => {
        if (event.type !== "message" || event.message.type !== "text") return null;

        const snap = await db.collection("flowRules").where("nodeName", "==", event.message.text).limit(1).get();
        if (snap.empty) return null;

        const data = snap.docs[0].data();
        let reply: line.Message;

        // 核心邏輯：動態組裝 Flex Carousel
        if (data.messageType === 'carousel' || (data.cards && data.cards.length > 0)) {
            reply = {
                type: "flex",
                altText: "預保中心最新資訊",
                contents: {
                    type: "carousel",
                    contents: data.cards.map((card: any) => ({
                        type: "bubble",
                        size: data.cardSize === 'sm' ? "micro" : "mega",
                        hero: { type: "image", url: card.imageUrl || "https://via.placeholder.com/800", size: "full", aspectRatio: "20:13", aspectMode: "cover" },
                        body: {
                            type: "box", layout: "vertical", contents: [
                                { type: "text", text: card.title || "品名", weight: "bold", size: "sm" },
                                { type: "text", text: card.price || "", size: "xs", color: "#ff0000", weight: "bold", margin: "sm" }
                            ]
                        },
                        footer: {
                            type: "box", layout: "vertical", contents: [
                                { type: "button", style: "primary", color: "#06C755", action: { type: "message", label: "點我訂購", text: card.title } }
                            ]
                        }
                    }))
                }
            };
        } else {
            reply = { type: "text", text: data.textContent || "內容未設定" };
        }

        return client.replyMessage(event.replyToken, reply);
    }));
    res.status(200).send("OK");
};
