import { Youtube, FileText } from 'lucide-react';

export default function LineSimulator({ data }: { data: any }) {
  if (!data || !data.nodeName) return null;

  const isFlex = data.messageType === 'flex';
  const isCarousel = data.messageType === 'carousel';
  const hasImage = !!data.imageUrl;
  const isLinkStyle = data.btnStyle === 'link';
  const hasButtons = data.buttons && data.buttons.length > 0;
  
  const isMicro = data.cardSize === 'sm';
  const cardWidth = isMicro ? 'w-40' : 'w-56';
  const defaultImg = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";

  return (
    <div className="w-full bg-[#7494C0] rounded-2xl overflow-hidden flex flex-col font-sans border border-white/10">
      <div className="bg-[#273246] text-white px-4 py-2 text-[9px] font-bold flex justify-between items-center tracking-widest">
        <span>LINE PREVIEW</span>
        <span className="text-[#deff9a] uppercase">{data.messageType}</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-end">
          <div className="bg-[#A0F080] rounded-xl rounded-tr-none px-3 py-1.5 text-xs text-slate-800 font-medium">
            {data.nodeName}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[9px] font-bold text-[#7494C0] flex-shrink-0 shadow-sm">BOT</div>
          
          <div className="flex-1 w-full overflow-hidden">
            {data.messageType === 'text' && (
              <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap shadow-sm">
                {data.textContent || "輸入文字..."}
              </div>
            )}

            {/* 👉 核心升級：顯示多圖堆疊 */}
            {data.messageType === 'image' && (
              <div className="flex flex-col gap-2">
                { (data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : [])).map((u: string, idx: number) => (
                    <div key={idx} className="w-48 bg-white rounded-xl overflow-hidden shadow-sm">
                        <img src={u || defaultImg} className="w-full aspect-square object-cover" alt="Preview" />
                    </div>
                ))}
                {(!data.imageUrls?.length && !data.imageUrl) && (
                    <div className="w-48 bg-white rounded-xl overflow-hidden shadow-sm">
                        <img src={defaultImg} className="w-full aspect-square object-cover" alt="Preview" />
                    </div>
                )}
              </div>
            )}

            {data.messageType === 'file' && (
              <div className="w-48 bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-slate-800 truncate">{data.textContent || "未命名檔案.pdf"}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">1.0 MB</div>
                </div>
              </div>
            )}

            {data.messageType === 'video' && (
              <div className="w-56 bg-white rounded-xl overflow-hidden shadow-sm flex flex-col border border-gray-100">
                <div className="relative aspect-video">
                  <img src={data.imageUrl || defaultImg} className="w-full h-full object-cover opacity-80" alt="Preview" />
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center"><Youtube className="text-white fill-white" size={20} /></div>
                  </div>
                </div>
                {data.textContent && (
                    <div className="p-3 text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                        {data.textContent}
                    </div>
                )}
              </div>
            )}

            {isFlex && (
              <div className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-xl flex flex-col border border-gray-100`}>
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

            {isCarousel && (
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
                 {data.cards?.map((card: any, idx: number) => (
                   <div key={idx} className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-100 flex flex-col`}>
                     {card.imageUrl && (
                        <div className="aspect-video bg-gray-100">
                            <img src={card.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                     )}
                     <div className="p-3 space-y-2 flex-1 flex flex-col">
                        <div className="font-bold text-xs text-slate-800">{card.title || "卡片標題"}</div>
                        <div className="text-[10px] text-slate-500 flex-1">{card.price || "內容說明"}</div>
                        
                        {card.buttons && card.buttons.length > 0 && (
                          <div className={`flex flex-col gap-1 pt-2 mt-auto ${isLinkStyle ? 'divide-y divide-gray-100 border-t border-gray-100' : ''}`}>
                            {card.buttons.map((btn: any, i: number) => (
                              isLinkStyle ? (
                                <div key={i} className="text-[#5584C0] text-center py-2 text-[10px] font-bold">
                                  {btn.label || `選項`} ▶▶
                                </div>
                              ) : (
                                <div key={i} className="bg-[#06C755] text-white text-center py-2 rounded-lg text-[10px] font-bold shadow-sm">
                                  {btn.label || "按鈕"}
                                </div>
                              )
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
