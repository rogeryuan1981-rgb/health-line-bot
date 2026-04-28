import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Link as LinkIcon, Image as ImageIcon, Video } from 'lucide-react';

export default function ResourceLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [newAsset, setNewAsset] = useState({ name: '', url: '', type: 'image' });

  useEffect(() => {
    // 👉 這裡監聽的是 'resources' 集合，專門放原始素材
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
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic text-[#06C755]">ASSET INVENTORY</h2>
          <p className="text-slate-500 text-xs font-bold uppercase">資源庫存管理 · 這裡存的東西可以在流程中調用</p>
        </div>
      </div>

      {/* 新增資源區 */}
      <div className="grid grid-cols-4 gap-4 mb-10 p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-xl">
        <input placeholder="資源名稱 (如: A懶人包)" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none" />
        <input placeholder="網址 (https://...)" value={newAsset.url} onChange={e => setNewAsset({...newAsset, url: e.target.value})} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none" />
        <select value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none">
          <option value="image">圖片/懶人包</option>
          <option value="video">影片內容</option>
        </select>
        <button onClick={handleAddAsset} className="bg-[#06C755] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90"><Plus size={18}/> 新增入庫</button>
      </div>

      {/* 資源列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-slate-900 p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-[#06C755]">
                {asset.type === 'video' ? <Video size={20}/> : <ImageIcon size={20}/>}
              </div>
              <div>
                <div className="text-sm font-bold">{asset.name}</div>
                <div className="text-[10px] text-slate-500 truncate w-32">{asset.url}</div>
              </div>
            </div>
            <button onClick={() => deleteDoc(doc(db, "resources", asset.id))} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
