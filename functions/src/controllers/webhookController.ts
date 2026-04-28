// ... 前面初始化不變 ...

export const handleWebhook = async (req: Request, res: Response) => {
    // ... 取得資料邏輯不變 ...
    const data = snapshot.docs[0].data();
    
    // 👉 組裝 Flex Message 輪播
    const flexContents = (data.cards || []).map((card: any) => ({
        type: "bubble",
        size: data.cardSize === 'sm' ? "micro" : "mega", // 👉 控制大小的關鍵！
        hero: {
            type: "image",
            url: card.imageUrl || "https://via.placeholder.com/800",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover"
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                { type: "text", text: card.title || "品名", weight: "bold", size: "sm" },
                { type: "text", text: card.price || "價格", size: "xs", color: "#ff0000", weight: "bold", margin: "sm" }
            ]
        },
        footer: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "button",
                    style: "primary",
                    color: "#06C755", // 👉 您的綠色按鈕
                    action: { type: "message", label: data.cardSize === 'sm' ? "訂購" : "點我訂購", text: card.title }
                }
            ]
        }
    }));

    const reply: line.FlexMessage = {
        type: "flex",
        altText: "今日菜單已送達",
        contents: {
            type: "carousel",
            contents: flexContents
        }
    };

    return client.replyMessage(event.replyToken, reply);
}
