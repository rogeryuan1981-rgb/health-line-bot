import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Image as ImageIcon, Video } from 'lucide-react';

export default function ResourceLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [newAsset, setNewAsset] = useState({ name: '', url: '', type: 'image' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "resources"), (snap) => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddAsset = async () => {
    if (!newAsset.name || !newAsset.url) return alert("請填寫名稱與網址");
    await addDoc(collection(db, "resources"), { ...newAsset, createdAt: serverTimestamp() });
    setNewAsset({ name: '', url: '', type: 'image' });
  };

  return (
    <div className="p-10 h-full overflow-y-auto bg-slate-950 text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-black italic text-[#06C755]">ASSET INVENTORY</h2>
        <p className="text-slate-500 text-xs font-bold uppercase mt-2">資源庫存管理 · 這裡存的東西可以在流程中調用</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 p-6 bg-slate-900 rounded-3xl border border-white/5">
        <input placeholder="資源名稱" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none" />
        <input placeholder="網址" value={newAsset.url} onChange={e => setNewAsset({...newAsset, url: e.target.value})} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none" />
        <select value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none">
          <option value="image">圖片/懶人包</option>
          <option value="video">影片內容</option>
        </select>
        <button onClick={handleAddAsset} className="bg-[#06C755] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"><Plus size={18}/> 新增入庫</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-slate-900 p-4 rounded-2xl border border-white/5 flex items-center justify-between group transition-all hover:border-[#06C755]/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-[#06C755]">
                {asset.type === 'video' ? <Video size={20}/> : <ImageIcon size={20}/>}
              </div>
              <div className="truncate w-32">
                <div className="text-sm font-bold truncate">{asset.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{asset.url}</div>
              </div>
            </div>
            <button onClick={() => deleteDoc(doc(db, "resources", asset.id))} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
