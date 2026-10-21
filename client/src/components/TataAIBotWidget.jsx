import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Minimize2, TrendingUp, HelpCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function TataAIBotWidget({ onTransactionRecorded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Halo! Saya Tata AI, asisten keuangan cerdas Anda. Ketik transaksi seperti "gajian 5jt" atau "beli bakso 15rb" untuk mencatat keuangan langsung ke saldo Anda, atau tanyakan tips finansial kapan saja! 🚀',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await apiFetch('/ai-bot/chat', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend })
      });

      if (res.ok && res.data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: res.data.reply,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        // If the message recorded a transaction, immediately sync the entire dashboard!
        if (res.data.isTransaction) {
          if (onTransactionRecorded) {
            onTransactionRecorded(res.data);
          }
          window.dispatchEvent(new CustomEvent('tatadana:data_updated', { detail: res.data }));
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: res.data.message || 'Maaf, terjadi kendala saat memproses pesan Anda.',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Tidak dapat terhubung ke server Tata AI.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-medium rounded-full shadow-lg hover:shadow-brand-500/25 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse"></span>
          </div>
          <span className="text-sm font-semibold tracking-wide">Tanya Tata AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[520px] bg-white border border-brand-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-brand-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-wide">Tata AI Advisor</h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-400/30 text-brand-100 rounded">
                    Fintech AI
                  </span>
                </div>
                <p className="text-xs text-brand-100/90 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Siap menganalisa keuangan Anda
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-brand-50/60 border-b border-brand-100 flex gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={() => handleSend('Cek saldo')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-brand-200 text-brand-700 rounded-lg hover:bg-brand-50 font-medium transition shadow-2xs"
            >
              💰 Cek Saldo
            </button>
            <button
              onClick={() => handleSend('gajian 5jt')}
              className="whitespace-nowrap px-2.5 py-1 bg-brand-100 border border-brand-300 text-brand-800 rounded-lg hover:bg-brand-200 font-semibold transition shadow-2xs"
            >
              💼 + gajian 5jt
            </button>
            <button
              onClick={() => handleSend('beli bakso 25rb')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-brand-200 text-brand-700 rounded-lg hover:bg-brand-50 font-medium transition shadow-2xs"
            >
              🍜 - beli bakso 25rb
            </button>
            <button
              onClick={() => handleSend('Beri saya tips hemat bulan ini')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-brand-200 text-brand-700 rounded-lg hover:bg-brand-50 font-medium transition shadow-2xs"
            >
              💡 Tips Hemat
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-brand-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-brand-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-xs text-brand-600 ml-1 font-medium">Tata AI sedang menganalisa...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-brand-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tanyakan keuangan ke Tata AI..."
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
