import { FlexMessage, FlexContainer } from '@line/bot-sdk';

/**
 * 根據節點資料 (nodeData)，動態產生對應的 Flex Message
 */
export const buildNodeFlexMessage = (nodeData: any): FlexMessage => {
  const type = nodeData.type || 'menu';
  let flexContainer: FlexContainer;

  if (type === 'video') {
    flexContainer = buildVideoFlex(nodeData);
  } else {
    // 預設為選單類型
    flexContainer = buildMenuFlex(nodeData);
  }

  return {
    type: 'flex',
    // altText 是顯示在聊天列表（對話外）的替代文字，非常重要
    altText: nodeData.title || '您有一則預防保健新訊息',
    contents: flexContainer
  };
};

/**
 * 版型 A：多重選單 (Menu)
 * 適合用在引導流程的初期，讓使用者選擇感興趣的分類
 */
const buildMenuFlex = (nodeData: any): FlexContainer => {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#1E293B', // 呼應後台深色模式的深藍灰色
      contents: [
        {
          type: 'text',
          text: nodeData.title || '請選擇想了解的主題',
          color: '#FFFFFF',
          weight: 'bold',
          size: 'lg'
        }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      // 動態產生選項按鈕
      contents: (nodeData.options || []).map((opt: any) => ({
        type: 'button',
        style: 'primary',
        color: '#3B82F6', // 按鈕主色
        action: {
          type: 'postback',
          label: opt.label,
          // 這裡非常關鍵：將目標節點 ID 藏在 data 裡面，不會顯示在對話框中
          data: `action=get_node&nodeId=${opt.targetNodeId}`
        }
      }))
    }
  };
};

/**
 * 版型 B：影片懶人包卡片 (Video)
 * 帶有封面大圖、主要標題，以及「觀看影片」與「其他引導」的按鈕
 */
const buildVideoFlex = (nodeData: any): FlexContainer => {
  return {
    type: 'bubble',
    hero: {
      type: 'image',
      // 若無設定圖片，先使用預設的健康意象圖
      url: nodeData.thumbnailUrl || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
      size: 'full',
      aspectRatio: '16:9',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: nodeData.title || '影片懶人包',
          weight: 'bold',
          size: 'xl',
          wrap: true
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        // 第一個按鈕永遠是開啟 YouTube 連結
        {
          type: 'button',
          style: 'primary',
          color: '#EF4444', // YouTube 的紅色
          action: {
            type: 'uri',
            label: '▶ 觀看影片',
            uri: nodeData.videoUrl || 'https://youtube.com'
          }
        },
        // 後面的按鈕則是我們設定的「下一步引導 (如: 返回主選單)」
        ...(nodeData.options || []).map((opt: any) => ({
          type: 'button',
          style: 'secondary',
          action: {
            type: 'postback',
            label: opt.label,
            data: `action=get_node&nodeId=${opt.targetNodeId}`
          }
        }))
      ]
    }
  };
};
