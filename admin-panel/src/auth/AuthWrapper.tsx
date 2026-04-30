import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽登入狀態切換
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("登入失敗", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div className="h-screen w-screen bg-[#020617] flex items-center justify-center text-[#deff9a] font-black italic animate-pulse">
      SYSTEM INITIALIZING...
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center space-y-8 font-sans">
        <div className="text-center space-y-2">
          <div className="bg-[#deff9a]/10 p-4 rounded-full inline-block mb-4 border border-[#deff9a]/20">
            <ShieldCheck size={48} className="text-[#deff9a]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">ADMIN PANEL ACCESS</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">請先驗證管理員身份</p>
        </div>
        
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <LogIn size={20} /> 使用 GOOGLE 帳號登入
        </button>
      </div>
    );
  }

  // 登入後顯示內容，並在右上角加一個登出按鈕
  return (
    <>
      <div className="fixed top-8 right-8 z-[200] flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-[#deff9a] uppercase tracking-tighter">Authorized User</span>
          <span className="text-[12px] font-bold text-white leading-tight">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-xl transition-all"
          title="登出系統"
        >
          <LogOut size={18} />
        </button>
      </div>
      {children}
    </>
  );
}
