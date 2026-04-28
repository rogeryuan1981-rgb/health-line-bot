import { Youtube } from 'lucide-react';

export default function LineSimulator({ data }: { data: any }) {
  if (!data || !data.nodeName) return null;

  const isFlex = data.messageType === 'flex';
  const hasImage = !!data.imageUrl;
  const isLinkStyle = data.btnStyle === 'link';
  const hasButtons = data.buttons && data.buttons.length > 0;
  const defaultImg = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";

  return (
    <div className="w-full bg-[#7494C0] rounded-2xl overflow-hidden flex flex-col font-sans border border-white/10">
      <div className="bg-[#273246] text-white px-4 py-2 text-[9px] font-bold flex justify-between items-center tracking-widest">
        <span>LINE PREVIEW</span>
        <span className="text-[#deff9a] uppercase">{data.messageType}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* User Side */}
        <div className="flex justify-end">
          <div className="bg-[#A0F080] rounded-xl rounded-tr-none px-3 py-1.5 text-xs text-slate-800 font-medium">
            {data.nodeName}
          </div>
        </div>

        {/* Bot Side */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[9px] font-bold text-[#7494C0] flex-shrink-0 shadow-sm">BOT</div>
          
          <div className="flex-1">
            {/* 1. 純文字模式 */}
            {data.messageType === 'text' && (
              <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap shadow-sm">
                {data.textContent || "輸入文字..."}
              </div>
            )}

            {/* 2. 圖片模式 */}
            {data.messageType === 'image' && (
              <div className="w-48 bg-white rounded-xl overflow-hidden shadow-sm">
                <img src={data.imageUrl || defaultImg} className="w-full aspect-square object-cover" alt="Preview" />
              </div>
            )}

            {/* 3. 影片模式 */}
            {data.messageType === 'video' && (
              <div className="w-48 bg-white rounded-xl overflow-hidden shadow-sm relative aspect-video">
                <img src={data.imageUrl || defaultImg} className="w-full h-full object-cover opacity-80" alt="Preview" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Youtube className="text-white fill-red-600" size={36} />
                </div>
              </div>
            )}

            {/* 4. 萬能 Flex 模式 (可文可圖可按鈕) */}
            {isFlex && (
              <div className="w-56 bg-white rounded-xl overflow-hidden shadow-xl flex flex-col border border-gray-100">
                {hasImage && (
                  <div className="aspect-video bg-gray-100">
                    <img src={data.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {data.textContent || "卡片內文..."}
                  </div>
                  
                  {hasButtons && (
                    <div className={`flex flex-col gap-1 mt-3 ${isLinkStyle ? 'divide-y divide-gray-100' : ''}`}>
                      {data.buttons.map((btn: any, i: number) => (
                        isLinkStyle ? (
                          <div key={i} className="text-[#5584C0] text-center py-3 text-xs font-bold">
                            {btn.label || `選項 ${i+1}`} ▶▶
                          </div>
                        ) : (
                          <div key={i} className="bg-[#06C755] text-white text-center py-2 rounded-lg text-[10px] font-bold shadow-sm">
                            {btn.label || "選擇"}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
