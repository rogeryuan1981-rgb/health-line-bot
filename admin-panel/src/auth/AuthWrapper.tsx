import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { LogIn, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';

// 🔒 管理員白名單 (請在此輸入您的 Email)
const ADMIN_WHITELIST = [
  'rogeryuan1981@gmail.com', // 請改成您的真實 Email
];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email) {
        // 檢查登入者的 Email 是否在白名單內
        if (ADMIN_WHITELIST.includes(currentUser.email)) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          // ❌ 不在白名單，強制登出並報錯
          signOut(auth);
          setUser(null);
          setAuthError("您的帳號不在管理員白名單內，存取被拒絕。");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
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
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Security Gate</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">請驗證管理員身份以存取畫布</p>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/50 px-6 py-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold animate-in shake-in">
            <AlertTriangle size={18} />
            {authError}
          </div>
        )}
        
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <LogIn size={20} /> 使用 GOOGLE 帳號登入
        </button>
      </div>
    );
  }

  // ✅ 驗證通過
  return (
    <>
      <div className="fixed top-8 right-8 z-[200] flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/10 shadow-2xl group transition-all hover:bg-slate-900">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-[#deff9a] uppercase tracking-tighter">Admin Verified</span>
          <span className="text-[12px] font-bold text-white leading-tight">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-xl transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
      {children}
    </>
  );
}
