// ... 前面引入與初始化不變 ...

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const events = req.body.events;
        if (!events || events.length === 0) return res.status(200).send("OK");

        await Promise.all(events.map(async (event: any) => {
            if (event.type !== "message" || event.message.type !== "text") return null;

            const userMessage = event.message.text;
            const snapshot = await db.collection("flowRules").where("nodeName", "==", userMessage).limit(1).get();

            if (snapshot.empty) return null;

            const data = snapshot.docs[0].data();
            let reply: line.Message;

            const actions: any[] = (data.buttons || []).slice(0, 4).map((btn: any) => ({
                type: "message",
                label: btn.label || "按鈕",
                text: btn.target || "無效"
            }));

            // 👉 加入比例設定
            const imageAspectRatio = data.imageAspectRatio || 'rectangle'; 

            if (data.messageType === "video" || data.messageType === "image") {
                reply = {
                    type: "template",
                    altText: "新訊息已送達",
                    template: {
                        type: "buttons",
                        imageAspectRatio: imageAspectRatio, // 👉 LINE 官方屬性實裝！
                        thumbnailImageUrl: data.imageUrl || "https://via.placeholder.com/800",
                        title: data.videoTitle || "教學內容",
                        text: "請選擇以下動作：",
                        actions: actions.length > 0 ? actions : [{ type: "message", label: "返回主選單", text: "開始" }]
                    }
                };
            } else {
                reply = { type: "text", text: data.textContent || "內容未設定" };
            }

            return client.replyMessage(event.replyToken, reply);
        }));

        res.status(200).send("OK");
    } catch (err) { res.status(500).send("Error"); }
};
