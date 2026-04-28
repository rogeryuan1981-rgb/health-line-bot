import { Request, Response } from 'firebase-functions';
import { WebhookEvent } from '@line/bot-sdk';

// 引入處理單一事件的核心邏輯 (我們將在下一個檔案建立它)
import { processEvent } from '../services/lineService';

export const handleLineWebhook = async (req: Request, res: Response) => {
  // 1. 安全性檢查：確保是 POST 請求
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // 2. 解析 LINE 傳送過來的事件陣列
  const events: WebhookEvent[] = req.body.events;

  // 當您在 LINE 官方後台點擊「Verify (驗證 Webhook 網址)」時，
  // LINE 會送出一個空的 events 陣列，這時我們必須回傳 200 表示驗證成功。
  if (!events || events.length === 0) {
    res.status(200).send('OK');
    return;
  }

  try {
    // 3. 處理所有進來的事件 (可能有使用者傳文字，或點擊 Flex Message 按鈕)
    // 使用 Promise.all 確保所有事件都被並行處理完畢
    await Promise.all(
      events.map(async (event) => {
        await processEvent(event);
      })
    );

    // 4. 成功處理後，務必回傳 200 給 LINE，否則 LINE 會判定失敗並重複發送訊息
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('事件處理失敗:', error);
    // 即使發生錯誤，實務上也建議回傳 200，避免 LINE 機制觸發重試轟炸
    res.status(200).send('Error Processed');
  }
};
