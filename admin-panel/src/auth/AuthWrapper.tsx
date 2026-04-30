import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase'; // 確保路徑只有一層 ../
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { LogIn, LogOut, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

// 🔒 管理員白名單 (請務必確認這裡的 Email 與您登入的一模一樣)
const ADMIN_WHITELIST = [
  '您的Email@gmail.com', 
];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // 監聽 Firebase 的 Auth 狀態變化
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userEmail = currentUser.email?.toLowerCase().trim();
        const isAllowed = ADMIN_WHITELIST.some(email => email.toLowerCase().trim() === userEmail);

        if (isAllowed) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          // ❌ 帳號不在白名單，閃回登入頁
          signOut(auth);
          setUser(null);
          setAuthError(`帳號 ${userEmail} 不在管理員名單中`);
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
      // 建議改用 signInWithPopup 並明確處理結果
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email?.toLowerCase().trim();
      
      if (!ADMIN_WHITELIST.some(email => email.toLowerCase().trim() === userEmail)) {
        await signOut(auth);
        setAuthError(`拒絕存取：${userEmail}`);
      }
    } catch (error: any) {
      console.error("登入失敗", error);
      setAuthError("登入過程發生錯誤，請稍後再試。");
    }
  };

  if (loading) return (
    <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center text-[#deff9a]">
      <Loader2 className="animate-spin mb-4" size={40} />
      <span className="font-black italic tracking-widest uppercase">Verifying Identity...</span>
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center space-y-8 font-sans">
        <div className="text-center space-y-2 px-4">
          <div className="bg-[#deff9a]/10 p-4 rounded-full inline-block mb-4 border border-[#deff9a]/20">
            <ShieldCheck size={48} className="text-[#deff9a]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Security Gate</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">請驗證管理員身份</p>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/50 px-6 py-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold max-w-md mx-auto">
            <AlertTriangle size={18} className="flex-shrink-0" />
            {authError}
          </div>
        )}
        
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <LogIn size={20} /> 使用 GOOGLE 登入
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-6 right-6 z-[200] flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-[#deff9a] uppercase tracking-tighter">Admin Access</span>
          <span className="text-[12px] font-bold text-white leading-tight">{user.displayName}</span>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-xl transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
      {children}
    </>
  );
}
