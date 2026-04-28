import { Client, WebhookEvent, Message } from '@line/bot-sdk';
import * as admin from 'firebase-admin';

// 引入將在下一個步驟建立的 Flex Message 組裝工具
import { buildNodeFlexMessage } from '../utils/flexBuilder';

// 初始化 LINE SDK 客戶端
// 實務上，Token 與 Secret 會設定在 Firebase 的環境變數中，避免外洩
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_CHANNEL_ACCESS_TOKEN',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'YOUR_CHANNEL_SECRET',
});

// 取得 Firestore 資料庫實例
const db = admin.firestore();

/**
 * 處理單一 LINE Webhook 事件
 */
export const processEvent = async (event: WebhookEvent) => {
  // 為了防止無限迴圈或處理不支援的格式，我們只處理「文字訊息」與「按鈕點擊(postback)」
  if (event.type !== 'message' && event.type !== 'postback') {
    return;
  }

  const replyToken = (event as any).replyToken;
  const userId = event.source.userId;

  if (!replyToken) return;

  try {
    if (event.type === 'message' && event.message.type === 'text') {
      // 處理使用者打字的文字訊息
      await handleText(event.message.text, replyToken, userId);
    } else if (event.type === 'postback') {
      // 處理使用者點擊卡片按鈕的事件 (多層引導的核心)
      await handlePostback(event.postback.data, replyToken, userId);
    }
  } catch (error) {
    console.error('執行回覆時發生錯誤:', error);
    // 若發生錯誤，回傳簡單的文字訊息安撫使用者
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '系統目前正在整理保健資訊，請稍後再試。'
    });
  }
};

/**
 * 處理文字訊息
 */
const handleText = async (text: string, replyToken: string, userId?: string) => {
  // 設定觸發多層引導的「啟動關鍵字」
  if (text.includes('預防保健') || text.includes('健康') || text.includes('選單')) {
    // 當命中關鍵字時，我們去資料庫抓取「第一層 (root)」的節點資料
    await replyWithNode('node-start', replyToken);
  } else {
    // 非關鍵字時的預設回覆 (或未來可以串接 AI 語意辨識)
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '您好！若想查詢健康資訊或觀看懶人包影片，請輸入「預防保健」來開啟服務選單。'
    });
  }
};

/**
 * 處理按鈕點擊 (Postback) - 實現多層引導
 * 按鈕背後的 data 格式預設設計為: "action=get_node&nodeId=diet_01"
 */
const handlePostback = async (postbackData: string, replyToken: string, userId?: string) => {
  // 將字串 "action=get_node&nodeId=diet_01" 解析成物件
  const params = new URLSearchParams(postbackData);
  const action = params.get('action');
  const nodeId = params.get('nodeId');

  if (action === 'get_node' && nodeId) {
    // 根據按鈕指定的下一層 Node ID，回傳對應的卡片
    await replyWithNode(nodeId, replyToken);
  }
};

/**
 * 核心共用方法：根據 Node ID 從資料庫抓取資料，並轉換成 Flex Message 回覆給使用者
 */
const replyWithNode = async (nodeId: string, replyToken: string) => {
  // 1. 從 Firestore 查詢該節點的設定資料
  // 這裡對應了我們在 React 後台「編輯面板」存進去的資料結構
  const nodeDoc = await db.collection('nodes').doc(nodeId).get();
  
  let replyMessage: Message;

  if (!nodeDoc.exists) {
    console.warn(`找不到節點資料: ${nodeId}，使用系統預設卡片`);
    // 若資料庫還沒建資料，先用我們寫在程式碼裡的預設 Flex Message
    replyMessage = buildNodeFlexMessage({
      id: nodeId,
      type: 'menu',
      title: '請選擇想了解的預防保健主題',
      options: [
        { label: '飲食建議', targetNodeId: 'node-content-diet' },
        { label: '運動教學', targetNodeId: 'node-content-exercise' }
      ]
    });
  } else {
    // 若資料庫有資料，則動態產出 Flex Message
    const nodeData = nodeDoc.data() as any;
    replyMessage = buildNodeFlexMessage(nodeData);
  }

  // 2. 呼叫 LINE API 送出訊息
  await lineClient.replyMessage(replyToken, replyMessage);
};
