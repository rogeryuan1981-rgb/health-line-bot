export default function LineSimulator({ data }: { data: any }) {
  if (!data || !data.nodeName) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-600 text-xs italic">
        等待配置資料以進行模擬...
      </div>
    );
  }

  const isMicro = data.cardSize === 'sm';
  const isSquare = data.imageAspectRatio === 'square';
  const cardWidth = isMicro ? 'w-36' : 'w-52';
  const previewImg = data.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";

  return (
    <div className="w-full bg-[#7494C0] rounded-2xl overflow-hidden flex flex-col font-sans border border-white/10">
      <div className="bg-[#273246] text-white px-4 py-2 text-[10px] font-bold flex justify-between">
        <span>LINE PREVIEW</span>
        <span className="text-[#06C755]">{data.messageType?.toUpperCase()}</span>
      </div>

      <div className="p-3 space-y-3 min-h-[200px]">
        {/* User Side */}
        <div className="flex justify-end">
          <div className="bg-[#A0F080] rounded-xl rounded-tr-none px-3 py-1.5 text-xs shadow-sm max-w-[80%] text-slate-800">
            {data.nodeName}
          </div>
        </div>

        {/* Bot Side */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[9px] font-bold text-[#7494C0] flex-shrink-0">BOT</div>
          <div className="flex-1 space-y-2">
            {data.messageType === 'text' && (
              <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 text-xs shadow-sm inline-block text-slate-700">
                {data.textContent || "文字內容未設定..."}
              </div>
            )}

            {(data.messageType === 'video' || data.messageType === 'image' || data.messageType === 'carousel') && (
              <div className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 transition-all duration-500`}>
                <div className={`${isSquare ? 'aspect-square' : 'aspect-video'} bg-gray-100 relative`}>
                  <img src={previewImg} className="w-full h-full object-cover" alt="LinePreview" />
                  {data.messageType === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Youtube className="text-white fill-red-600" size={32} /></div>}
                </div>
                <div className="p-3 space-y-1">
                  <div className="font-bold text-xs text-slate-800 truncate">{data.videoTitle || "標題"}</div>
                  <div className="text-[10px] text-red-500 font-black">{data.price || "即將推出"}</div>
                  <div className="mt-2 bg-[#06C755] text-white text-center py-1.5 rounded-lg text-[9px] font-bold">查看詳情</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
