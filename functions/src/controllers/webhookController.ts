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
        if (event.type !== "message" || event.message.type !== "text") return null;

        const userMsg = event.message.text;
        let snap = await db.collection("flowRules").where("nodeName", "==", userMsg).limit(1).get();

        if (snap.empty) {
            snap = await db.collection("flowRules").where("nodeName", "==", "預設回覆").limit(1).get();
        }
        if (snap.empty) return null;

        const data = snap.docs[0].data();
        // LINE SDK 支援 replyMessage 傳送單一物件或陣列 (最多 5 個)
        let reply: line.Message | line.Message[];

        const mapButtons = (btns: any[], style: string) => {
            return (btns || []).map((btn: any) => {
                const target = btn.target || "";
                const isUrl = target.toLowerCase().startsWith('http');
                
                return {
                    type: "button",
                    height: "sm",
                    style: style === 'link' ? "link" : "primary",
                    color: style === 'link' ? "#5584C0" : "#06C755", 
                    action: isUrl 
                        ? { type: "uri", label: btn.label || "開啟連結", uri: target } 
                        : { type: "message", label: btn.label || "未命名選項", text: target || "無效指令" } 
                };
            });
        };

        switch (data.messageType) {
            // 👉 核心升級：解析多張圖片並回傳 Array
            case "image":
                const imgUrls = (data.imageUrls && data.imageUrls.length > 0) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
                const validUrls = imgUrls.filter((u: string) => u && u.trim() !== "");
                
                if (validUrls.length === 0) {
                    reply = { type: "text", text: "圖片已遺失或未設定" };
                } else {
                    reply = validUrls.slice(0, 5).map((u: string) => ({
                        type: "image",
                        originalContentUrl: u,
                        previewImageUrl: u
                    }));
                }
                break;

            case "file":
                reply = {
                    type: "file",
                    originalContentUrl: data.fileUrl,
                    fileName: data.textContent || "檔案.pdf",
                    fileSize: 1048576 
                };
                break;

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

            case "text":
            default:
                reply = { type: "text", text: data.textContent || "無預設內容" };
        }

        return client.replyMessage(event.replyToken, reply);
    }));

    res.status(200).send("OK");
};
