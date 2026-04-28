import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Video, Image as ImageIcon, MessageSquare, PlayCircle } from 'lucide-react';

export default function ResourceLibrary() {
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "flowRules"), (snap) => {
      setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-background h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-foreground">自動回覆資源庫</h2>
          <p className="text-muted-foreground mt-1">管理所有影音教學、圖解懶人包與文字回覆資源</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold border border-primary/20">
          共 {resources.length} 筆資源
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resources.map((res) => (
          <div key={res.id} className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Preview Section */}
            <div className="aspect-video bg-muted relative">
              {res.imageUrl ? (
                <img src={res.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                   {res.messageType === 'video' ? <Video size={40} className="text-red-500"/> : <MessageSquare size={40} className="text-muted-foreground"/>}
                </div>
              )}
              {res.messageType === 'video' && <PlayCircle className="absolute top-2 right-2 text-white fill-red-600 shadow-lg" size={24}/>}
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${res.messageType === 'video' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {res.messageType}
                </span>
                <span className="text-[10px] text-muted-foreground italic">Key: {res.nodeName}</span>
              </div>
              <h3 className="font-bold text-sm text-foreground truncate">{res.videoTitle || res.nodeName}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{res.textContent || "這是您設定的自動回覆內容..."}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
