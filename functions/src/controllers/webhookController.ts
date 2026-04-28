// ... 初始化保持不變 ...

export const handleWebhook = async (req: Request, res: Response) => {
    // ... 取得資料邏輯 ...
    const data = snapshot.docs[0].data();
    let reply: any;

    if (data.messageType === 'flex') {
        // 👉 1. 決定圖片區塊 (Hero)
        const heroSection = data.imageUrl ? {
            type: "image", url: data.imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover"
        } : null;

        // 👉 2. 決定按鈕樣式
        const actions = (data.buttons || []).map((btn: any) => ({
            type: "button",
            style: data.btnStyle === 'link' ? "link" : "primary",
            color: data.btnStyle === 'link' ? "#5584C0" : "#06C755",
            action: { type: "message", label: btn.label || "點擊", text: btn.target || "無效指令" }
        }));

        reply = {
            type: "flex",
            altText: "新訊息送達",
            contents: {
                type: "bubble",
                ...(heroSection ? { hero: heroSection } : {}), // 有圖片才加 hero
                body: {
                    type: "box", layout: "vertical",
                    contents: [
                        { type: "text", text: data.textContent || "內容", wrap: true, size: "sm", color: "#333333" },
                        { type: "box", layout: "vertical", margin: "md", spacing: "sm", contents: actions }
                    ]
                }
            }
        };
    } else {
        // ... 原本的文字、圖片回覆邏輯 ...
    }

    return client.replyMessage(event.replyToken, reply);
}
