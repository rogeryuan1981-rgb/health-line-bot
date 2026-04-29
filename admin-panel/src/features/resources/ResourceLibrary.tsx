import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, Edit2, Check, X, Image as ImageIcon, FileText, Video } from 'lucide-react';

export default function ResourceLibrary() {
  const [resources, setResources] = useState<any[]>([]);
  
  // 新增資源的狀態
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'image' | 'video' | 'file'>('image');
  const [isAdding, setIsAdding] = useState(false);
  
  // 編輯模式的狀態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState<'image' | 'video' | 'file'>('image');

  // 列表過濾器
  const [listFilter, setListFilter] = useState<'all' | 'image' | 'video' | 'file'>('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "resources"), (snap) => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return alert("請填寫資源名稱與網址");
    setIsAdding(true);
    await addDoc(collection(db, "resources"), {
      name: newName.trim(),
      url: newUrl.trim(),
      type: newType,
      createdAt: serverTimestamp()
    });
    setNewName('');
    setNewUrl('');
    setNewType('image'); // 恢復預設
    setIsAdding(false);
  };

  const startEdit = (res: any) => {
    setEditingId(res.id);
    setEditName(res.name || '');
    setEditUrl(res.url || '');
    // 兼容舊資料，如果舊資料沒寫 type，就預設為 image
    setEditType(res.type || 'image');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editUrl.trim()) return alert("請填寫資源名稱與網址");
    await updateDoc(doc(db, "resources", id), {
      name: editName.trim(),
      url: editUrl.trim(),
      type: editType,
      updatedAt: serverTimestamp()
    });
    setEditingId(null);
  };

  // 依據選擇的分類回傳對應的圖示元件
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="text-rose-400" size={16} />;
      case 'file': return <FileText className="text-blue-400" size={16} />;
      case 'image': 
      default: return <ImageIcon className="text-emerald-400" size={16} />;
    }
  };

  // 過濾後的資源列表
  const filteredResources = resources.filter(res => {
      if (listFilter === 'all') return true;
      const t = res.type || 'image'; // 舊資料防呆
      return t === listFilter;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto text-white font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
            <h1 className="text-3xl font-black text-[#deff9a] tracking-tight">自動回覆資源庫</h1>
            <p className="text-slate-400 text-sm mt-1">統一建檔與管理對話機器人需要調用的圖片、影片與文件。</p>
        </div>
      </div>

      {/* 👉 新增資源區塊 */}
      <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl border border-white/5 mb-8 space-y-4">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <span className="bg-[#deff9a] text-black w-5 h-5 flex items-center justify-center rounded-full text-xs">＋</span> 
            新增資源
        </h3>
        
        {/* 建檔分類選擇器 */}
        <div className="flex gap-2 p-1 bg-slate-900 w-fit rounded-lg">
            <button onClick={() => setNewType('image')} className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${newType === 'image' ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}><ImageIcon size={14}/> 圖片</button>
            <button onClick={() => setNewType('video')} className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${newType === 'video' ? 'bg-slate-700 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}><Video size={14}/> 影片</button>
            <button onClick={() => setNewType('file')} className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${newType === 'file' ? 'bg-slate-700 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><FileText size={14}/> 文件</button>
        </div>

        <div className="flex gap-4">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="資源名稱 (例如: 成人預防保健型錄)" className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#deff9a] focus:ring-1 ring-[#deff9a]" />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="HTTPS 網址" className="flex-[2] bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#deff9a] focus:ring-1 ring-[#deff9a]" />
          <button onClick={handleAdd} disabled={isAdding} className="bg-[#deff9a] text-black font-black px-8 rounded-xl hover:scale-105 active:scale-95 transition-transform whitespace-nowrap shadow-lg">寫入資源庫</button>
        </div>
      </div>

      {/* 👉 列表分類與管理區塊 */}
      <div className="space-y-4">
        {/* 列表過濾頁籤 */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
            <button onClick={() => setListFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${listFilter === 'all' ? 'bg-[#deff9a]/10 text-[#deff9a]' : 'text-slate-500 hover:bg-slate-800'}`}>全部資源</button>
            <button onClick={() => setListFilter('image')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${listFilter === 'image' ? 'bg-[#deff9a]/10 text-[#deff9a]' : 'text-slate-500 hover:bg-slate-800'}`}>圖片區</button>
            <button onClick={() => setListFilter('video')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${listFilter === 'video' ? 'bg-[#deff9a]/10 text-[#deff9a]' : 'text-slate-500 hover:bg-slate-800'}`}>影片區</button>
            <button onClick={() => setListFilter('file')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${listFilter === 'file' ? 'bg-[#deff9a]/10 text-[#deff9a]' : 'text-slate-500 hover:bg-slate-800'}`}>文件區</button>
        </div>

        {/* 資源列表 */}
        <div className="space-y-3">
            {filteredResources.map(res => (
            <div key={res.id} className="bg-[#1e293b] p-4 rounded-xl flex items-center justify-between border border-white/5 hover:border-white/20 transition-all group shadow-sm">
                {editingId === res.id ? (
                <div className="flex-1 flex flex-col gap-3 mr-4">
                    <div className="flex gap-2 p-1 bg-slate-900 w-fit rounded-lg border border-white/5">
                        <button onClick={() => setEditType('image')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${editType === 'image' ? 'bg-slate-700 text-emerald-400' : 'text-slate-500'}`}><ImageIcon size={12}/> 圖片</button>
                        <button onClick={() => setEditType('video')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${editType === 'video' ? 'bg-slate-700 text-rose-400' : 'text-slate-500'}`}><Video size={12}/> 影片</button>
                        <button onClick={() => setEditType('file')} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${editType === 'file' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}><FileText size={12}/> 文件</button>
                    </div>
                    <div className="flex gap-3">
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="資源名稱" />
                        <input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="flex-[2] bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="資源網址" />
                    </div>
                </div>
                ) : (
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <div className="bg-slate-900 p-3 rounded-xl border border-white/5 shadow-inner">
                        {getTypeIcon(res.type || 'image')}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm text-slate-200">{res.name}</span>
                    <span className="text-xs text-slate-500 truncate mt-1">{res.url}</span>
                    </div>
                </div>
                )}

                <div className="flex items-center gap-2">
                {editingId === res.id ? (
                    <>
                    <button onClick={() => handleSaveEdit(res.id)} className="p-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-xl transition-colors"><Check size={18}/></button>
                    <button onClick={() => setEditingId(null)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"><X size={18}/></button>
                    </>
                ) : (
                    <>
                    <button onClick={() => startEdit(res)} className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"><Edit2 size={18}/></button>
                    <button onClick={() => { if(window.confirm("確定刪除此資源？")) deleteDoc(doc(db, "resources", res.id)) }} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </>
                )}
                </div>
            </div>
            ))}
            {filteredResources.length === 0 && (
                <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
                    此分類目前沒有任何資源
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
