import { Youtube, ExternalLink } from 'lucide-react';

interface LineSimulatorProps {
  data: {
    nodeName?: string;
    messageType?: string;
    textContent?: string;
    videoTitle?: string;
    videoUrl?: string;
    imageUrl?: string;
    imageAspectRatio?: 'rectangle' | 'square'; // 👉 新增尺寸判斷
    buttons?: { label: string; target: string }[];
  };
}

export default function LineSimulator({ data }: LineSimulatorProps) {
  if (!data.nodeName) return null;

  // 判斷比例的 CSS 類名
  const aspectRatioClass = data.imageAspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div className="fixed bottom-6 right-6 w-64 bg-[#7494C0] rounded-t-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col z-50 font-sans animate-in slide-in-from-bottom-5">
      <div className="bg-[#273246] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-bold">
        <span>LINE 模擬器</span>
        <div className="flex gap-1 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      </div>

      <div className="p-2.5 space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide">
        <div className="flex justify-end">
          <div className="bg-[#A0F080] rounded-xl rounded-tr-none px-2 py-1 text-[12px] shadow-sm max-w-[85%] text-slate-800">
            {data.nodeName}
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[8px] font-bold text-[#7494C0] flex-shrink-0">BOT</div>
          <div className="flex-1 space-y-1.5">
            {data.messageType === 'text' && (
              <div className="bg-white rounded-xl rounded-tl-none px-2.5 py-1.5 text-[12px] shadow-sm inline-block text-slate-700">
                {data.textContent || "請輸入內容..."}
              </div>
            )}

            {(data.messageType === 'video' || data.messageType === 'image') && (
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 w-full">
                {/* 👉 動態比例圖片區 */}
                <div className={`${aspectRatioClass} bg-gray-100 relative overflow-hidden transition-all duration-300`}>
                  <img src={data.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"} alt="Preview" className="w-full h-full object-cover" />
                  {data.messageType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Youtube className="text-white fill-red-600" size={32} />
                    </div>
                  )}
                </div>
                
                <div className="p-2 space-y-0.5">
                  <h4 className="font-bold text-[12px] truncate text-slate-800">{data.videoTitle || "未設定標題"}</h4>
                  <p className="text-[10px] text-gray-400 line-clamp-1">點擊下方按鈕進行下一步。</p>
                </div>

                <div className="border-t border-gray-50 flex flex-col divide-y divide-gray-50">
                  {data.buttons?.map((btn, i) => (
                    <div key={i} className="py-1.5 text-center text-[#5584C0] text-[11px] font-bold active:bg-gray-100">
                      {btn.label || "按鈕名稱"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
