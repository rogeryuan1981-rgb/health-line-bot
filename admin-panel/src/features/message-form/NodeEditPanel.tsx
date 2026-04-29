import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

// ⚠️ 羅傑大大注意：這裡請務必維持你「原本」的 Token 寫法！
const client = new line.Client({ 
    channelAccessToken: "這裡請放回你原本真實的 Access Token", 
    channelSecret: "這裡請放回你原本真實的 Secret" 
});

export const handleWebhook = async (req: Request, res: Response) => {
    const events = req.body.events;
    
    if (!events || events.length === 0) {
        res.status(200).send("OK");
        return; 
    }

    await Promise.all(events.map(async (event: any) => {
        if (event.type !== "message" || event.message.type !== "text") return null;

        const userMsg = event.message.text.trim();
        let snap = await db.collection("flowRules").where("nodeName", "==", userMsg).limit(1).get();

        if (snap.empty) {
            snap = await db.collection("flowRules").where("nodeName", "==", "預設回覆").limit(1).get();
        }
        if (snap.empty) return null;

        const data = snap.docs[0].data();
        let reply: any;

        // 👉 終極防護 1：過濾空白按鈕、確保 URI 格式正確
        const mapButtons = (btns: any[], style: string) => {
            // 只保留有填寫標籤或目標的合法按鈕
            const validBtns = (btns || []).filter(b => b.label || b.target);
            if (validBtns.length === 0) return [];

            return validBtns.map((btn: any) => {
                const target = (btn.target || "").trim();
                const isUrl = target.toLowerCase().startsWith('http');
                
                return {
                    type: "button",
                    height: "sm",
                    style: style === 'link' ? "link" : "primary",
                    color: style === 'link' ? "#5584C0" : "#06C755", 
                    action: isUrl 
                        ? { type: "uri", label: btn.label || "開啟連結", uri: target } 
                        : { type: "message", label: btn.label || "選擇", text: target || btn.label || "無效指令" } 
                };
            });
        };

        // 👉 終極防護 2：動態組裝 Flex Body，避免出現 LINE 嚴禁的「空字串」或「空陣列」
        const buildFlexBody = (text: string, buttons: any[], style: string) => {
            const contents: any[] = [];
            
            // 如果有文字，才加入文字區塊
            if (text && text.trim() !== "") {
                contents.push({ type: "text", text: text, wrap: true, size: "sm", color: "#333333" });
            }
            
            // 如果有合法按鈕，才加入按鈕區塊
            const mappedBtns = mapButtons(buttons, style);
            if (mappedBtns.length > 0) {
                contents.push({ type: "box", layout: "vertical", spacing: "sm", contents: mappedBtns });
            }
            
            // LINE 規定 box 不能為空，如果使用者都沒填，塞一個安全的空白字元保底
            if (contents.length === 0) {
                contents.push({ type: "text", text: " ", size: "sm" });
            }
            
            return { type: "box", layout: "vertical", spacing: "md", contents };
        };

        switch (data.messageType) {
            case "image":
                const imgUrls = (data.imageUrls && data.imageUrls.length > 0) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
                const validUrls = imgUrls.filter((u: string) => u && u.trim().startsWith("http"));
                
                if (validUrls.length === 0) {
                    reply = { type: "text", text: "圖片已遺失或未設定正確網址" };
                } else {
                    reply = validUrls.slice(0, 5).map((u: string) => ({
                        type: "image",
                        originalContentUrl: u,
                        previewImageUrl: u
                    }));
                }
                break;

            case "file":
                const fUrl = (data.fileUrl || "").trim();
                if (!fUrl.startsWith("http")) {
                    reply = { type: "text", text: "檔案網址設定錯誤" };
                } else {
                    reply = {
                        type: "file",
                        originalContentUrl: fUrl,
                        fileName: data.textContent || "檔案.pdf",
                        fileSize: 1048576 
                    };
                }
                break;

            case "flex":
                reply = {
                    type: "flex",
                    altText: data.nodeName || "訊息送達",
                    contents: {
                        type: "bubble",
                        size: data.cardSize === 'sm' ? "micro" : "mega",
                        // 只在有合法 HTTPS 網址時，才產生圖片區塊
                        ...((data.imageUrl && data.imageUrl.startsWith('http')) ? {
                            hero: { type: "image", url: data.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" }
                        } : {}),
                        body: buildFlexBody(data.textContent, data.buttons, data.btnStyle)
                    }
                };
                break;

            case "carousel":
                const validCards = (data.cards || []).filter((c:any) => c.title || c.price || c.imageUrl || (c.buttons && c.buttons.length > 0));
                if (validCards.length === 0) {
                    reply = { type: "text", text: "輪播卡片內容為空" };
                } else {
                    reply = {
                        type: "flex",
                        altText: data.nodeName || "請選擇項目",
                        contents: {
                            type: "carousel",
                            contents: validCards.map((card: any) => ({
                                type: "bubble",
                                size: data.cardSize === 'sm' ? "micro" : "mega",
                                ...((card.imageUrl && card.imageUrl.startsWith('http')) ? {
                                    hero: { type: "image", url: card.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" }
                                } : {}),
                                body: {
                                    type: "box", layout: "vertical", spacing: "sm",
                                    contents: [
                                        ...(card.title ? [{ type: "text", text: card.title, weight: "bold", size: "sm" }] : []),
                                        ...(card.price ? [{ type: "text", text: card.price, size: "xs", color: "#888888", wrap: true }] : []),
                                        ...(mapButtons(card.buttons, data.btnStyle).length > 0 ? [{ type: "box", layout: "vertical", spacing: "xs", margin: "md", contents: mapButtons(card.buttons, data.btnStyle) }] : []),
                                        ...((!card.title && !card.price && mapButtons(card.buttons, data.btnStyle).length === 0) ? [{ type: "text", text: " ", size: "sm" }] : [])
                                    ]
                                }
                            }))
                        }
                    };
                }
                break;

            case "video":
                const vUrl = (data.videoUrl || "").trim();
                const cUrl = (data.imageUrl || "").trim();
                if (!vUrl.startsWith("http")) {
                    reply = { type: "text", text: "影片網址未設定或格式錯誤" };
                } else if (data.textContent) {
                    reply = {
                        type: "flex",
                        altText: "影音訊息",
                        contents: {
                            type: "bubble",
                            ...((cUrl && cUrl.startsWith('http')) ? {
                                hero: { type: "image", url: cUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover", action: { type: "uri", uri: vUrl } }
                            } : {}),
                            body: {
                                type: "box", layout: "vertical",
                                contents: [{ type: "text", text: data.textContent, wrap: true, size: "sm" }]
                            },
                            footer: {
                                type: "box", layout: "vertical",
                                contents: [{ type: "button", style: "primary", color: "#FF0000", action: { type: "uri", label: "📺 觀看影片", uri: vUrl } }]
                            }
                        }
                    };
                } else {
                    reply = {
                        type: "template", altText: "影片訊息",
                        template: {
                            type: "buttons", 
                            ...((cUrl && cUrl.startsWith('http')) ? { thumbnailImageUrl: cUrl } : {}),
                            title: "影音內容", text: "點擊觀看詳細影片",
                            actions: [{ type: "uri", label: "📺 觀看影片", uri: vUrl }]
                        }
                    };
                }
                break;

            case "text":
            default:
                reply = { type: "text", text: data.textContent || "無預設內容" };
        }

        // 👉 終極防護 3：加上 Try-Catch 攔截錯誤，確保 Functions 不會因為單一訊息崩潰
        try {
            return await client.replyMessage(event.replyToken, reply);
        } catch (error) {
            console.error("❌ LINE API 拒絕了這包訊息格式:", JSON.stringify(reply, null, 2));
            console.error("錯誤詳情:", error);
            // 這裡可以選擇回傳簡單文字告知系統異常，或者安靜失敗
            return null;
        }
    }));

    res.status(200).send("OK");
};
