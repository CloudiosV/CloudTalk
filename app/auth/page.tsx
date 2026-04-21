"use client";
import { useState } from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" }); 
  
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    password: "" 
  });

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: "", type: "" }); 
    
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          setStatusMsg({ 
            text: "Login Berhasil! Mengalihkan...", 
            type: "success" 
          });
          
          
          window.location.href = "/"; 
          
        } else {
          setStatusMsg({ 
            text: "Registrasi Berhasil! Silahkan login.", 
            type: "success" 
          });
          setIsLogin(true); 
          resetForm();
        }
      } else {
        setStatusMsg({ text: data.message, type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Cek koneksi server kamu!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F3F1FF] p-4 font-sans">
      <div className="flex w-full max-w-6xl min-h-[600px] bg-white/60 backdrop-blur-lg rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(93,95,239,0.1)]">
        
        {/* KIRI: BRANDING SPACE */}
        <div className="hidden md:flex w-[50%] p-16 flex-col justify-between items-start relative bg-gradient-to-br from-[#5D5FEF] to-[#4A4CD9] text-white">
          <div className="z-10">
            <h1 className="text-3xl font-black tracking-tighter">CloudTalk.</h1>
          </div>
          
          <div className="z-10 w-full flex flex-col items-center">
            <div className="relative group">
              <img 
                src="/images/authIcon.png" 
                alt="Illustration"
                className="relative w-80 h-80 object-contain transform transition duration-500 hover:scale-105" 
              />
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Better together</h3>
              <p className="text-indigo-100/80 font-light max-w-xs mx-auto">
                Join thousands of people connecting in a more meaningful way.
              </p>
            </div>
          </div>
        </div>

        {/* KANAN: FORM INTERAKTIF */}
        <div className="w-full md:w-[50%] p-8 md:p-20 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-gray-400 mt-3 text-sm">
                {isLogin ? "Please enter your details to sign in." : "Fill in the information below to register."}
              </p>
            </div>

            {/* NOTIFIKASI UI */}
            {statusMsg.text && (
              <div className={`mb-6 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
                statusMsg.type === "success" 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {statusMsg.text}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isLogin ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                <label className="text-xs font-bold text-gray-400 ml-2 mb-1 block uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  placeholder="Your unique name"
                  value={formData.username}
                  required={!isLogin}
                  className="w-full px-6 py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white outline-none transition-all text-sm text-gray-700 placeholder:text-gray-300"
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 ml-2 mb-1 block uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  value={formData.email}
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white outline-none transition-all text-sm text-gray-700 placeholder:text-gray-300"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 ml-2 mb-1 block uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={formData.password}
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white outline-none transition-all text-sm text-gray-700 placeholder:text-gray-300"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                disabled={loading}
                className="w-full bg-[#5D5FEF] hover:bg-[#4d4fdf] text-white font-bold py-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(93,95,239,0.4)] transition-all transform active:scale-[0.98] tracking-widest mt-6 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs"
              >
                {loading ? "Processing..." : isLogin ? "Sign In" : "Get Started"}
              </button>
            </form>

            <div className="mt-12 text-center text-sm">
              <span className="text-gray-400">
                {isLogin ? "New here?" : "Joined us before?"}
              </span>
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setStatusMsg({ text: "", type: "" });
                }}
                className="ml-2 text-[#5D5FEF] font-extrabold hover:text-[#4d4fdf] transition-colors underline decoration-2 underline-offset-8"
              >
                {isLogin ? "Create an account" : "Log in to account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}