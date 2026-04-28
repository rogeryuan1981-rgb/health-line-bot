export default function LineSimulator({ data }: { data: any }) {
  if (!data || !data.nodeName) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-600 text-[10px] font-bold tracking-widest uppercase">
        Waiting for configuration...
      </div>
    );
  }

  const isMicro = data.cardSize === 'sm';
  const cardWidth = isMicro ? 'w-40' : 'w-56';
  const defaultImg = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";
  const hasButtons = data.buttons && data.buttons.length > 0;

  return (
    <div className="w-full bg-[#7494C0] rounded-2xl overflow-hidden flex flex-col font-sans border border-white/10">
      <div className="bg-[#273246] text-white px-4 py-2 text-[9px] font-bold flex justify-between items-center tracking-widest">
        <span>LINE PREVIEW</span>
        <span className="text-[#deff9a] uppercase">{data.messageType}</span>
      </div>

      <div className="p-4 space-y-4 min-h-[200px]">
        {/* User Side */}
        <div className="flex justify-end">
          <div className="bg-[#A0F080] rounded-xl rounded-tr-none px-3 py-1.5 text-xs shadow-sm max-w-[80%] text-slate-800 font-medium">
            {data.nodeName}
          </div>
        </div>

        {/* Bot Side */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[9px] font-bold text-[#7494C0] flex-shrink-0 shadow-sm">BOT</div>
          
          <div className="flex-1 space-y-2">
            {/* 文字模式 */}
            {data.messageType === 'text' && (
              <div className="space-y-2">
                <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 text-xs shadow-sm inline-block text-slate-700 whitespace-pre-wrap">
                  {data.textContent || "輸入回覆文字..."}
                </div>
                {/* 👉 一般按鈕 (Quick Reply)：圓角膠囊狀，灰色調 */}
                {hasButtons && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {data.buttons.map((btn: any, i: number) => (
                      <div key={i} className="bg-white text-slate-700 text-[10px] font-bold text-center px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                        {btn.label || `一般選項 ${i+1}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 圖片/影片模式 (單一卡片) */}
            {(data.messageType === 'video' || data.messageType === 'image') && (
              <div className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100`}>
                <div className="aspect-video bg-gray-100 relative">
                  <img src={data.imageUrl || defaultImg} className="w-full h-full object-cover" alt="Preview" />
                  {data.messageType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1"></div></div>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {(data.title || data.textContent) && (
                    <div>
                      {data.title && <div className="font-bold text-xs text-slate-800">{data.title}</div>}
                      {data.textContent && <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{data.textContent}</div>}
                    </div>
                  )}
                  {/* 👉 綠色按鈕：實心綠色大按鈕，佔滿寬度 */}
                  {hasButtons && (
                    <div className="space-y-1.5 pt-1 border-t border-gray-100 mt-2">
                      {data.buttons.map((btn: any, i: number) => (
                        <div key={i} className="bg-[#06C755] text-white text-center py-2 rounded-lg text-[10px] font-bold shadow-sm">
                          {btn.label || "卡片按鈕"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 輪播模式 */}
            {data.messageType === 'carousel' && (
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 {data.cards?.map((card: any, idx: number) => (
                   <div key={idx} className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-100`}>
                     <div className="aspect-video bg-gray-200">
                        <img src={card.imageUrl || defaultImg} className="w-full h-full object-cover" alt="Preview" />
                     </div>
                     <div className="p-3 space-y-2">
                        <div className="font-bold text-xs text-slate-800 truncate">{card.title || "卡片標題"}</div>
                        <div className="text-[10px] text-red-500 font-bold">{card.price || "詳情"}</div>
                        
                        {/* 👉 綠色按鈕 (輪播專用) */}
                        {card.buttons && card.buttons.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-gray-100 mt-2">
                            {card.buttons.map((btn: any, i: number) => (
                              <div key={i} className="bg-[#06C755] text-white text-center py-2 rounded-lg text-[10px] font-bold shadow-sm">
                                {btn.label || "卡片按鈕"}
                              </div>
                            ))}
                          </div>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
