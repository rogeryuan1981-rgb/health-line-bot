import { Request, Response } from "express";
import * as line from "@line/bot-sdk";

// ⚠️ 請將這裡替換成您剛剛拿到的兩把鑰匙
const config = {
    channelAccessToken: "eQCJp/rLnS7EQMAlG8Usw11kBQYr4xaZAk15CxSVe+nGK32zZni58WsXILleNK5gIwcPpeBw7UvJKEjsgRqBm8SJ1k4JFDfhUlCZ+ta/12cpg7CfyBmgejXsHqutQL9S8WKmoc3CXDIVt9noMCl3cwdB04t89/1O/w1cDnyilFU=",
    channelSecret: "14c91b3caaa31d8583e3175dfb9c052f"
};

// 建立 LINE 溝通客戶端
const client = new line.Client(config);

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const events = req.body.events;

        // 如果沒有事件，直接回傳 200 OK 讓 LINE 知道我們活著
        if (!events || events.length === 0) {
            res.status(200).send("OK");
            return;
        }

        // 處理每一個進來的事件 (利用 Promise.all 平行處理，效能更好)
        await Promise.all(
            events.map(async (event: line.WebhookEvent) => {
                // 我們這次先只處理「文字訊息」，忽略貼圖或圖片
                if (event.type !== "message" || event.message.type !== "text") {
                    return Promise.resolve(null);
                }

                // 抓出使用者打的字
                const userMessage = event.message.text;
                console.log(`收到使用者訊息: ${userMessage}`);

                // 準備回傳的訊息結構
                const replyMessage: line.TextMessage = {
                    type: "text",
                    text: `您剛才說的是：「${userMessage}」對吧！`
                };

                // 透過 LINE 提供的 replyToken 將訊息推播回去
                return client.replyMessage(event.replyToken, replyMessage);
            })
        );

        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook 處理錯誤:", error);
        res.status(500).send("Internal Server Error");
    }
};
