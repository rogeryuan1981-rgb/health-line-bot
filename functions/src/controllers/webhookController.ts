import { Request, Response } from "express";
import * as line from "@line/bot-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

// ⚠️ 維持羅傑大大原本的 Token 寫法
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

    const configSnap = await db.doc("botConfig/production").get();
    if (!configSnap.exists) {
        console.error("尚未發布任何 botConfig/production 地圖");
        res.status(200).send("OK");
        return;
    }
    const { nodes = [], edges = [] } = configSnap.data() as any;

    await Promise.all(events.map(async (event: any) => {
        if (event.type !== "message" || event.message.type !== "text") return null;

        const userMsg = event.message.text.trim();
        const userId = event.source.userId;
        let targetNode: any = null;

        // 🚀 引擎 1：全域攔截 (任意門) - 嚴格限制只有 isGlobal 開啟時才生效
        targetNode = nodes.find((n: any) => 
            n.isGlobal === true && n.nodeName && n.nodeName.trim() === userMsg
        );

        // 👉 引擎 2：狀態尋徑 (若沒命中全域字)
        if (!targetNode) {
            const userStateSnap = await db.collection("userStates").doc(userId).get();
            if (userStateSnap.exists) {
                const currentNodeId = userStateSnap.data()?.currentNodeId;
                const currentNode = nodes.find((n: any) => n.id === currentNodeId);

                if (currentNode) {
                    const options = currentNode.options || currentNode.buttons || [];
                    const matchedIndex = options.findIndex((opt: any) => 
                        (opt.target && opt.target.trim() === userMsg) ||
                        (opt.keyword && opt.keyword.trim() === userMsg) ||
                        (opt.label && opt.label.trim() === userMsg)
                    );

                    if (matchedIndex !== -1) {
                        const edge = edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === `opt_${matchedIndex}`);
                        if (edge) {
                            targetNode = nodes.find((n: any) => n.id === edge.target);
                        }
                    }
                }
            }
        }

        // 👉 兜底防呆：回到預設回覆
        if (!targetNode) {
            targetNode = nodes.find((n: any) => n.nodeName === '預設回覆');
        }

        if (!targetNode) return null;

        // 👉 核心邏輯：處理「隱形節點」 (如 Time Router 時間分流)
        let currentNodeToRender = targetNode;
        let loopCount = 0;

        while (currentNodeToRender && currentNodeToRender.messageType === 'time_router' && loopCount < 5) {
            loopCount++;
            const config = currentNodeToRender.config || {};
            const isForceOff = config.forceOffHours === true;

            // 取得精準的台灣時間 (UTC+8)
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const twDate = new Date(utc + (3600000 * 8));
            const hours = String(twDate.getHours()).padStart(2, '0');
            const mins = String(twDate.getMinutes()).padStart(2, '0');
            const currentTwTimeStr = `${hours}:${mins}`;

            let isBusiness = false;
            if (!isForceOff) {
                const startTime = config.startTime || "09:00";
                const endTime = config.endTime || "18:00";
                if (currentTwTimeStr >= startTime && currentTwTimeStr <= endTime) {
                    const day = twDate.getDay();
                    if (config.workDays && Array.isArray(config.workDays)) {
                        if (config.workDays.includes(day)) isBusiness = true;
                    } else {
                        isBusiness = true;
                    }
                }
            }

            const handleToFollow = isBusiness ? 'business' : 'off-hours';
            const nextEdge = edges.find((e: any) => e.source === currentNodeToRender.id && e.sourceHandle === handleToFollow);

            if (nextEdge) {
                currentNodeToRender = nodes.find((n: any) => n.id === nextEdge.target);
            } else {
                currentNodeToRender = null; 
            }
        }

        if (!currentNodeToRender || currentNodeToRender.messageType === 'time_router') return null;

        // ==========================================
        // 渲染節點內容 
        // ==========================================
        const data = currentNodeToRender;
        let reply: any;

        const mapButtons = (btns: any[], style: string) => {
            const validBtns = (btns || []).filter(b => b.label || b.target);
            if (validBtns.length === 0) return [];
            return validBtns.map((btn: any) => {
                const target = (btn.target || "").trim();
                const isUriAction = target.toLowerCase().startsWith('http') || target.toLowerCase().startsWith('tel:');
                return {
                    type: "button", height: "sm",
                    style: style === 'link' ? "link" : "primary",
                    color: style === 'link' ? "#5584C0" : "#06C755", 
                    action: isUriAction 
                        ? { type: "uri", label: btn.label || "開啟連結", uri: target } 
                        : { type: "message", label: btn.label || "選擇", text: target || btn.label || "無效指令" } 
                };
            });
        };

        const buildFlexBody = (text: string, buttons: any[], style: string) => {
            const contents: any[] = [];
            if (text && text.trim() !== "") contents.push({ type: "text", text: text, wrap: true, size: "sm", color: "#333333" });
            const mappedBtns = mapButtons(buttons, style);
            if (mappedBtns.length > 0) contents.push({ type: "box", layout: "vertical", spacing: "sm", contents: mappedBtns });
            if (contents.length === 0) contents.push({ type: "text", text: " ", size: "sm" });
            return { type: "box", layout: "vertical", spacing: "md", contents };
        };

        switch (data.messageType) {
            case "image":
                const imgUrls = (data.imageUrls && data.imageUrls.length > 0) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
                const validUrls = imgUrls.filter((u: string) => u && u.trim().startsWith("http"));
                if (validUrls.length === 0) reply = { type: "text", text: "圖片已遺失或未設定正確網址" };
                else reply = validUrls.slice(0, 5).map((u: string) => ({ type: "image", originalContentUrl: u, previewImageUrl: u }));
                break;
            case "file":
                const fUrl = (data.fileUrl || "").trim();
                if (!fUrl.startsWith("http")) reply = { type: "text", text: "檔案網址設定錯誤" };
                else reply = { type: "file", originalContentUrl: fUrl, fileName: data.textContent || "檔案.pdf", fileSize: 1048576 };
                break;
            case "flex":
                reply = {
                    type: "flex", altText: data.nodeName || "訊息送達",
                    contents: {
                        type: "bubble", size: data.cardSize === 'sm' ? "micro" : "mega",
                        ...((data.imageUrl && data.imageUrl.startsWith('http')) ? { hero: { type: "image", url: data.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" } } : {}),
                        body: buildFlexBody(data.textContent, data.buttons || data.options, data.btnStyle)
                    }
                };
                break;
            case "carousel":
                const validCards = (data.cards || []).filter((c:any) => c.title || c.price || c.imageUrl || (c.buttons && c.buttons.length > 0));
                if (validCards.length === 0) reply = { type: "text", text: "輪播卡片內容為空" };
                else reply = {
                    type: "flex", altText: data.nodeName || "請選擇項目",
                    contents: {
                        type: "carousel",
                        contents: validCards.map((card: any) => ({
                            type: "bubble", size: data.cardSize === 'sm' ? "micro" : "mega",
                            ...((card.imageUrl && card.imageUrl.startsWith('http')) ? { hero: { type: "image", url: card.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" } } : {}),
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
                break;
            case "video":
                const vUrl = (data.videoUrl || "").trim();
                const cUrl = (data.imageUrl || "").trim();
                if (!vUrl.startsWith("http")) reply = { type: "text", text: "影片網址未設定或格式錯誤" };
                else if (data.textContent) reply = {
                    type: "flex", altText: "影音訊息",
                    contents: {
                        type: "bubble",
                        ...((cUrl && cUrl.startsWith('http')) ? { hero: { type: "image", url: cUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover", action: { type: "uri", uri: vUrl } } } : {}),
                        body: { type: "box", layout: "vertical", contents: [{ type: "text", text: data.textContent, wrap: true, size: "sm" }] },
                        footer: { type: "box", layout: "vertical", contents: [{ type: "button", style: "primary", color: "#FF0000", action: { type: "uri", label: "📺 觀看影片", uri: vUrl } }] }
                    }
                };
                else reply = {
                    type: "template", altText: "影片訊息",
                    template: { type: "buttons", ...((cUrl && cUrl.startsWith('http')) ? { thumbnailImageUrl: cUrl } : {}), title: "影音內容", text: "點擊觀看詳細影片", actions: [{ type: "uri", label: "📺 觀看影片", uri: vUrl }] }
                };
                break;
            case "text":
            default:
                reply = { type: "text", text: data.textContent || "無預設內容" };
        }

        try {
            // 👉 推播前：更新使用者所在的節點位置
            await db.collection("userStates").doc(userId).set({
                currentNodeId: currentNodeToRender.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return await client.replyMessage(event.replyToken, reply);
        } catch (error) {
            console.error("❌ LINE API 拒絕了這包訊息格式:", JSON.stringify(reply, null, 2));
            console.error("錯誤詳情:", error);
            return null;
        }
    }));

    res.status(200).send("OK");
};
