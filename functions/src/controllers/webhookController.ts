import { Request, Response } from "express";

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        // 這裡放您原本處理 LINE 訊息的邏輯
        // 例如：const events = req.body.events;
        
        console.log("收到 LINE 訊號:", JSON.stringify(req.body));
        
        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook 錯誤:", error);
        res.status(500).send("Internal Server Error");
    }
};
