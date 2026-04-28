import { Youtube, MessageSquare, ExternalLink } from 'lucide-react';

interface LineSimulatorProps {
  data: {
    nodeName?: string;
    messageType?: string;
    textContent?: string;
    videoTitle?: string;
    videoUrl?: string;
    imageUrl?: string;
    buttons?: { label: string; target: string }[];
  };
}

export default function LineSimulator({ data }: LineSimulatorProps) {
  if (!data.nodeName) return null;

  return (
    <div className="fixed bottom-6 right-6 w-72 bg-[#7494C0] rounded-t-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col z-50 font-sans animate-in slide-in-from-bottom-5 duration-300">
      {/* LINE Header */}
      <div className="bg-[#273246] text-white px-4 py-2 flex items-center justify-between text-sm font-bold">
        <span>LINE 實時模擬器</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
        {/* User Bubble */}
        <div className="flex justify-end">
          <div className="bg-[#A0F080] rounded-2xl rounded-tr-none px-3 py-1.5 text-sm shadow-sm max-w-[80%]">
            {data.nodeName}
          </div>
        </div>

        {/* Bot Bubble */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#7494C0] border border-gray-200 flex-shrink-0">
            BOT
          </div>
          
          <div className="flex-1 space-y-2">
            {/* 文字訊息 */}
            {data.messageType === 'text' && (
              <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 text-sm shadow-sm inline-block">
                {data.textContent || "請輸入內容..."}
              </div>
            )}

            {/* 卡片訊息 (影片/圖片) */}
            {(data.messageType === 'video' || data.messageType === 'image') && (
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 w-full">
                {/* Image Header */}
                <div className="aspect-video bg-gray-100 relative group overflow-hidden">
                  <img 
                    src={data.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {data.messageType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Youtube className="text-white fill-red-600" size={40} />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-3 space-y-1">
                  <h4 className="font-bold text-sm truncate">{data.videoTitle || "卡片標題"}</h4>
                  <p className="text-[11px] text-gray-500 line-clamp-2">點擊下方按鈕查看更多內容或進行下一步操作。</p>
                </div>

                {/* Buttons */}
                <div className="border-t border-gray-100 flex flex-col">
                  {data.messageType === 'video' && (
                    <div className="py-2 text-center text-[#5584C0] text-xs font-bold border-b border-gray-50 flex items-center justify-center gap-1">
                      <ExternalLink size={12} /> 觀看影片
                    </div>
                  )}
                  {data.buttons?.map((btn, i) => (
                    <div key={i} className="py-2 text-center text-[#5584C0] text-xs font-bold border-b border-gray-50 last:border-0 active:bg-gray-50 cursor-default">
                      {btn.label || "按鈕名稱"}
                    </div>
                  ))}
                  {(!data.buttons || data.buttons.length === 0) && data.messageType !== 'video' && (
                    <div className="py-2 text-center text-gray-300 text-xs italic">尚無設定按鈕</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/90 p-2 text-[9px] text-gray-400 text-center italic border-t border-gray-200">
        模擬畫面僅供參考，實際效果以手機為準
      </div>
    </div>
  );
}
