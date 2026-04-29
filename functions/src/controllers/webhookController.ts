import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

// ⚠️ 羅傑大大注意：這裡請務必維持你「原本」的 Token 寫法！
const client = new line.Client({ 
    channelAccessToken: "AYVtEDZdBNI2Uzy+4zu1+FhNHZ7Ly4b6v69Hz2swC3ntdpS+3vdLcMZmescCUSPCIwcPpeBw7UvJKEjsgRqBm8SJ1k4JFDfhUlCZ+ta/12fnVxs+Nrlcbg2sX/Tvkxj3ARK4kpd0myiKqEWLTL0ApgdB04t89/1O/w1cDnyilFU=", 
    channelSecret: "14c91b3caaa31d8583e3175dfb9c052f" 
});

export const handleWebhook = async (req: Request, res: Response) => {
    const events = req.body.events;
    
    if (!events || events.length === 0) {
        res.status(200).send("OK");
        return; 
    }

    await Promise.all(events.map(async (event: any) => {
        // 目前僅處理文字訊息，如果是貼圖或圖片等其他類型也會觸發兜底，你可以將條件放寬
        if (event.type !== "message" || event.message.type !== "text") return null;

        const userMsg = event.message.text;
        
        // 👉 第一道防線：精確比對使用者輸入的關鍵字
        let snap = await db.collection("flowRules").where("nodeName", "==", userMsg).limit(1).get();

        // 👉 第二道防線 (Fallback)：如果找不到，自動攔截並呼叫「預設回覆」節點
        if (snap.empty) {
            snap = await db.collection("flowRules").where("nodeName", "==", "預設回覆").limit(1).get();
        }

        // 如果你在畫布上連「預設回覆」都還沒建立，就真的只能放生了
        if (snap.empty) return null;

        const data = snap.docs[0].data();
        let reply: any;

        const mapButtons = (btns: any[], style: string) => {
            return (btns || []).map((btn: any) => ({
                type: "button",
                height: "sm",
                style: style === 'link' ? "link" : "primary",
                color: style === 'link' ? "#5584C0" : "#06C755", 
                action: { 
                    type: "message", 
                    label: btn.label || "未命名選項", 
                    text: btn.target || "無效指令" 
                }
            }));
        };

        switch (data.messageType) {
            case "flex":
                reply = {
                    type: "flex",
                    altText: "訊息送達",
                    contents: {
                        type: "bubble",
                        size: data.cardSize === 'sm' ? "micro" : "mega",
                        ...(data.imageUrl ? {
                            hero: { type: "image", url: data.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" }
                        } : {}),
                        body: {
                            type: "box", layout: "vertical", spacing: "md",
                            contents: [
                                { type: "text", text: data.textContent || "", wrap: true, size: "sm", color: "#333333" },
                                { type: "box", layout: "vertical", spacing: "sm", contents: mapButtons(data.buttons, data.btnStyle) }
                            ]
                        }
                    }
                };
                break;

            case "carousel":
                reply = {
                    type: "flex",
                    altText: "請選擇項目",
                    contents: {
                        type: "carousel",
                        contents: (data.cards || []).map((card: any) => ({
                            type: "bubble",
                            size: data.cardSize === 'sm' ? "micro" : "mega",
                            ...(card.imageUrl ? {
                                hero: { type: "image", url: card.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" }
                            } : {}),
                            body: {
                                type: "box", layout: "vertical", spacing: "sm",
                                contents: [
                                    { type: "text", text: card.title || "標題", weight: "bold", size: "sm" },
                                    { type: "text", text: card.price || "", size: "xs", color: "#888888", wrap: true },
                                    { type: "box", layout: "vertical", spacing: "xs", margin: "md", contents: mapButtons(card.buttons, data.btnStyle) }
                                ]
                            }
                        }))
                    }
                };
                break;

            case "video":
                if (data.textContent) {
                    reply = {
                        type: "flex",
                        altText: "影音訊息",
                        contents: {
                            type: "bubble",
                            hero: { 
                                type: "image", url: data.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover",
                                action: { type: "uri", uri: data.videoUrl } 
                            },
                            body: {
                                type: "box", layout: "vertical",
                                contents: [{ type: "text", text: data.textContent, wrap: true, size: "sm" }]
                            },
                            footer: {
                                type: "box", layout: "vertical",
                                contents: [{ type: "button", style: "primary", color: "#FF0000", action: { type: "uri", label: "📺 觀看影片", uri: data.videoUrl } }]
                            }
                        }
                    };
                } else {
                    reply = {
                        type: "template", altText: "影片訊息",
                        template: {
                            type: "buttons", thumbnailImageUrl: data.imageUrl, title: "影音教學", text: "點擊觀看詳細影片",
                            actions: [{ type: "uri", label: "📺 觀看影片", uri: data.videoUrl }]
                        }
                    };
                }
                break;

            case "image":
                reply = { type: "image", originalContentUrl: data.imageUrl, previewImageUrl: data.imageUrl };
                break;

            case "text":
            default:
                reply = { type: "text", text: data.textContent || "無預設內容" };
        }

        return client.replyMessage(event.replyToken, reply);
    }));

    res.status(200).send("OK");
};
