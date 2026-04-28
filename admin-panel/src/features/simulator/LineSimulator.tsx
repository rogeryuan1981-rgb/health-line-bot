export default function LineSimulator({ data }: { data: any }) {
  if (!data || !data.nodeName) return null;

  // 👉 根據 cardSize 決定模擬器卡片寬度
  const isMicro = data.cardSize === 'sm';
  const cardWidth = isMicro ? 'w-40' : 'w-56';

  return (
    <div className="fixed bottom-6 right-[400px] w-72 bg-[#7494C0] rounded-t-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col z-50">
      <div className="bg-[#273246] text-white px-4 py-2 text-xs font-bold flex justify-between">
        <span>LINE 實時預覽</span>
        <span className="opacity-50">{isMicro ? '微型模式' : '標準模式'}</span>
      </div>

      <div className="p-3 space-y-4 max-h-[450px] overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {data.cards?.map((card: any, i: number) => (
            <div key={i} className={`${cardWidth} bg-white rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-gray-100`}>
              <div className={`${isMicro ? 'h-24' : 'h-32'} bg-gray-200 relative`}>
                <img src={card.imageUrl || "https://via.placeholder.com/400"} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-1">
                <div className="font-bold text-sm text-slate-800">{card.title || "品名"}</div>
                <div className="text-xs text-red-500 font-black">{card.price || "NT$ 0"}</div>
                {/* 仿圖片中的綠色按鈕 */}
                <div className="mt-2 bg-[#06C755] text-white text-center py-1.5 rounded-lg text-[10px] font-bold">
                  {isMicro ? "訂購" : "點我訂購"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
