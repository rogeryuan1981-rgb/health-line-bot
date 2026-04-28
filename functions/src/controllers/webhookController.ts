import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

// 初始化管理員權限 (這讓大腦有權力看資料庫)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// 您的 LINE 金鑰
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
                console.log(`收到訊息: ${userMessage}`);

                // 🔍 到 flowRules 集合中尋找有沒有 nodeName 剛好等於 userMessage 的資料
                const flowRef = db.collection("flowRules");
                const snapshot = await flowRef.where("nodeName", "==", userMessage).limit(1).get();

                let replyText = "";

                if (snapshot.empty) {
                    // 找不到設定時的回覆
                    replyText = `收到訊息「${userMessage}」，但我目前還沒學會這招，請到後台設定喔！`;
                } else {
                    // 找到對應的設定了
                    const nodeData = snapshot.docs[0].data();
                    replyText = `【系統連線成功】\n偵測到關鍵字：${nodeData.nodeName}\n這是我剛從雲端資料庫抓出來的回覆！`;
                }

                return client.replyMessage(event.replyToken, {
                    type: "text",
                    text: replyText
                });
            })
        );

        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook 處理錯誤:", error);
        res.status(500).send("Internal Server Error");
    }
};
