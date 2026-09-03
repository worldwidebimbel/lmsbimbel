"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Search, Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Contact {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface Conversation {
  user: Contact;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  GURU: "Guru", SISWA: "Siswa", ADMIN: "Admin", SUPER_ADMIN: "Admin", ORANG_TUA: "Orang Tua",
};

function Avatar({ name, avatar, size = "md" }: { name: string; avatar: string | null; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "h-10 w-10 text-base" : size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  if (avatar) return <img src={avatar} alt={name} className={`${s} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${s} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 font-semibold text-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface Props {
  currentUserId: string;
  initialContacts: Contact[];
  defaultContactId?: string;
}

export default function ChatInterface({ currentUserId, initialContacts, defaultContactId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts] = useState<Contact[]>(initialContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    defaultContactId ? (initialContacts.find((c) => c.id === defaultContactId) ?? null) : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (res.ok) setConversations(await res.json());
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when contact changes
  const loadMessages = useCallback(async (contactId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat?with=${contactId}`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedContact) return;
    loadMessages(selectedContact.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(selectedContact.id), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedContact, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!selectedContact || !input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedContact.id, content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        loadConversations();
      } else {
        setInput(content);
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // Contacts not yet in conversations
  const existingContactIds = new Set(conversations.map((c) => c.user.id));
  const newContacts = contacts.filter((c) => !existingContactIds.has(c.id));

  const filtered = [
    ...conversations.filter((c) => !search || c.user.name.toLowerCase().includes(search.toLowerCase())),
  ];
  const filteredNew = newContacts.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-gray-100">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kontak..." className="w-full rounded-lg bg-gray-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && filteredNew.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <MessageSquare className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada percakapan</p>
            </div>
          )}

          {filtered.map((conv) => (
            <button key={conv.user.id}
              onClick={() => setSelectedContact(conv.user)}
              className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${selectedContact?.id === conv.user.id ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
              <div className="relative">
                <Avatar name={conv.user.name} avatar={conv.user.avatar} />
                {conv.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">{conv.unread}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 truncate">{conv.user.name}</span>
                  <span className="shrink-0 text-[10px] text-gray-500 ml-1">
                    {formatDistanceToNow(new Date(conv.lastAt), { locale: localeId, addSuffix: false })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
              </div>
            </button>
          ))}

          {filteredNew.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-gray-500 tracking-wide">Kontak Tersedia</div>
              {filteredNew.map((c) => (
                <button key={c.id} onClick={() => setSelectedContact(c)}
                  className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${selectedContact?.id === c.id ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                  <Avatar name={c.name} avatar={c.avatar} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABEL[c.role] ?? c.role}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      {!selectedContact ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
            <MessageSquare className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Pilih kontak untuk mulai chat</h3>
          <p className="mt-1 text-sm text-gray-500">Pilih dari daftar kiri atau cari nama</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
            <Avatar name={selectedContact.name} avatar={selectedContact.avatar} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{selectedContact.name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABEL[selectedContact.role] ?? selectedContact.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages && messages.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center py-8"><p className="text-sm text-gray-500">Belum ada pesan. Mulai percakapan!</p></div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${isMine ? "text-indigo-200" : "text-gray-500"}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { locale: localeId, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-end gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ketik pesan... (Enter untuk kirim)" rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-28 overflow-y-auto" />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
