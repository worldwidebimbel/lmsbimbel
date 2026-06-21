"use client";

import { useState } from "react";
import { Trophy, Star, Zap, Users, Award, Flame, ExternalLink, Printer } from "lucide-react";
import type { PointBreakdown, Badge } from "@/lib/gamification";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
}

interface CertificateEntry {
  id: string;
  code: string;
  type: string;
  title: string;
  eventName: string | null;
  score: number | null;
  rank: number | null;
  issuedAt: string;
}

interface Props {
  totalPoints: number;
  level: number;
  levelName: string;
  levelColor: string;
  levelBg: string;
  nextLevelPoints: number;
  progressToNextLevel: number;
  breakdown: PointBreakdown[];
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
  myRank: number;
  branchLeaderboard?: LeaderboardEntry[];
  myBranchRank?: number;
  studentId: string;
  streak?: number;
  certificates?: CertificateEntry[];
}

const TYPE_LABEL: Record<string, string> = {
  LMS_COMPLETION: "Kelulusan LMS",
  EVENT_PARTICIPATION: "Peserta Event",
  EVENT_WINNER: "Juara Event",
};

const TABS = [
  { id: "overview", label: "Overview", icon: Star },
  { id: "badges", label: "Badge", icon: Trophy },
  { id: "sertifikat", label: "Sertifikat", icon: Award },
  { id: "leaderboard", label: "Leaderboard", icon: Users },
];

function AvatarPlaceholder({ name, avatar, size = "md" }: { name: string; avatar: string | null; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-sm";
  if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 font-bold text-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function PrestasiClient({
  totalPoints, level, levelName, levelColor, levelBg, nextLevelPoints,
  progressToNextLevel, breakdown, badges, leaderboard, myRank,
  branchLeaderboard = [], myBranchRank = 0, studentId,
  streak = 0, certificates = [],
}: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [leaderboardScope, setLeaderboardScope] = useState<"class" | "branch">("class");
  const activeLeaderboard = leaderboardScope === "branch" ? branchLeaderboard : leaderboard;
  const activeRank = leaderboardScope === "branch" ? myBranchRank : myRank;
  const hasBranchLeaderboard = branchLeaderboard.length > 0;

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);
  void activeRank;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
          <Trophy className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestasi & Gamifikasi</h1>
          <p className="text-sm text-gray-500">Poin, level, badge, dan peringkat kelas</p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className={`inline-flex items-center gap-1.5 rounded-full ${levelBg} ${levelColor} px-3 py-1 text-xs font-bold mb-2`}>
              <Zap className="h-3.5 w-3.5" />
              Level {level} — {levelName}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{totalPoints.toLocaleString()}</span>
              <span className="text-lg text-white/70">poin</span>
            </div>
            <p className="mt-1 text-sm text-white/70">
              {progressToNextLevel < 100
                ? `${nextLevelPoints - totalPoints} poin lagi ke Level ${level + 1}`
                : "Level Maksimum! 🎉"}
            </p>
            <div className="mt-3 h-2 w-48 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressToNextLevel}%` }} />
            </div>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Peringkat Kelas</p>
              <div className="text-4xl font-black">#{myRank}</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Flame className="h-5 w-5 text-orange-300" />
                <span className="text-2xl font-black">{streak}</span>
              </div>
              <p className="text-[11px] text-white/70 mt-0.5">hari streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="font-semibold text-gray-900">Rincian Poin</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {breakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.count} aktivitas × {item.points / (item.count || 1)} poin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">+{item.points}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                <span className="font-semibold text-gray-800">Total Poin</span>
                <span className="text-lg font-black text-blue-700">{totalPoints}</span>
              </div>
            </div>
          </div>

          {/* Quick Badges Preview */}
          {earnedBadges.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-gray-900">Badge Terbaru</h3>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5">
                    <span className="text-lg">{b.icon}</span>
                    <span className="text-xs font-semibold text-yellow-800">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <div className="space-y-4">
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Diraih ({earnedBadges.length})</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {earnedBadges.map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-2 rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-4 text-center shadow-sm">
                    <span className="text-4xl">{b.icon}</span>
                    <p className="text-sm font-bold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.description}</p>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">✓ Diraih</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lockedBadges.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">Belum Diraih ({lockedBadges.length})</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {lockedBadges.map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center opacity-60">
                    <span className="text-4xl grayscale">{b.icon}</span>
                    <p className="text-sm font-bold text-gray-500">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.description}</p>
                    <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-500">🔒 Terkunci</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sertifikat Tab */}
      {activeTab === "sertifikat" && (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Belum ada sertifikat</p>
              <p className="text-sm text-gray-400 mt-1">Raih Level 3 atau ikuti lomba/tryout untuk mendapat sertifikat</p>
            </div>
          ) : (
            certificates.map((cert) => (
              <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0 shadow">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{cert.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{TYPE_LABEL[cert.type] ?? cert.type}</span>
                    {cert.eventName && <span>{cert.eventName}</span>}
                    {cert.score != null && <span>Nilai: {cert.score}</span>}
                    {cert.rank != null && <span>Peringkat: #{cert.rank}</span>}
                    <span>{new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={`/sertifikat/${cert.code}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                    <ExternalLink className="w-3.5 h-3.5" /> Lihat
                  </a>
                  <a href={`/sertifikat/${cert.code}`} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => { e.preventDefault(); const w = window.open(`/sertifikat/${cert.code}`, "_blank"); w?.addEventListener("load", () => w.print()); }}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
                    <Printer className="w-3.5 h-3.5" /> Cetak
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {leaderboardScope === "branch" ? "Peringkat Cabang" : "Peringkat Kelas"}
            </h3>
            {hasBranchLeaderboard && (
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setLeaderboardScope("class")}
                  className={`px-3 py-1 text-xs rounded-md font-medium ${
                    leaderboardScope === "class" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardScope("branch")}
                  className={`px-3 py-1 text-xs rounded-md font-medium ${
                    leaderboardScope === "branch" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Cabang
                </button>
              </div>
            )}
          </div>
          {activeLeaderboard.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Belum ada data leaderboard</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeLeaderboard.map((entry, idx) => {
                const rank = idx + 1;
                const isMe = entry.id === studentId;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                  >
                    <div className="w-8 text-center">
                      {rank <= 3 ? (
                        <span className="text-xl">{MEDAL[rank]}</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-400">#{rank}</span>
                      )}
                    </div>
                    <AvatarPlaceholder name={entry.name} avatar={entry.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-blue-700" : "text-gray-900"}`}>
                        {entry.name} {isMe && <span className="text-xs text-blue-500">(Kamu)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{entry.points.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">poin</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
