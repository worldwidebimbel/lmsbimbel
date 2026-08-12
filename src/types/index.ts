export type UserRole = "SUPER_ADMIN" | "ADMIN" | "GURU" | "SISWA" | "ORANG_TUA" | "AFILIATOR";
export type FeatureTier = "BASIC" | "STANDARD" | "PREMIUM";
export type ClassType = "REGULER" | "PRIVAT" | "ONLINE";
export type MaterialType = "PDF" | "VIDEO" | "YOUTUBE" | "PRESENTATION" | "DOCUMENT" | "LINK" | "TEXT";
export type QuestionType = "PILGAN" | "ESSAY" | "BENAR_SALAH" | "ISIAN";
export type AttendanceStatus = "HADIR" | "SAKIT" | "IZIN" | "ALPHA";
export type InvoiceStatus = "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";
export type NotifType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "PAYMENT" | "ATTENDANCE" | "GRADE" | "ASSIGNMENT" | "EXAM" | "PPDB" | "AFFILIATE";
export type StudentStatus = "AKTIF" | "TUNGGAKAN" | "NONAKTIF" | "LULUS" | "BERHENTI";

export interface FeatureFlag {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  tier: FeatureTier;
  category: string;
  icon?: string | null;
  affectedRoles: string[];
  sortOrder: number;
  modifiedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  icon?: string | null;
  isActive: boolean;
}

export interface Class {
  id: string;
  name: string;
  description?: string | null;
  subjectId: string;
  teacherId: string;
  type: ClassType;
  maxStudents: number;
  isActive: boolean;
  subject?: Subject;
  teacher?: User;
  _count?: { students: number };
}

export interface Schedule {
  id: string;
  classId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  isRecurring: boolean;
  class?: Class;
}

export interface Material {
  id: string;
  title: string;
  description?: string | null;
  classId?: string | null;
  subjectId?: string | null;
  uploaderId: string;
  type: MaterialType;
  fileUrl?: string | null;
  isPublished: boolean;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  classId: string;
  teacherId: string;
  dueDate: Date;
  maxScore: number;
  isPublished: boolean;
  createdAt: Date;
  _count?: { submissions: number };
}

export interface Exam {
  id: string;
  title: string;
  classId: string;
  duration: number;
  startTime?: Date | null;
  endTime?: Date | null;
  passingScore: number;
  isPublished: boolean;
  createdAt: Date;
  _count?: { questions: number; attempts: number };
}

export interface Attendance {
  id: string;
  classId: string;
  date: Date;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  attendanceId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
  student?: User;
}

export interface Invoice {
  id: string;
  studentId: string;
  amount: number;
  dueDate: Date;
  status: InvoiceStatus;
  createdAt: Date;
  student?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotifType;
  isRead: boolean;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetRoles: string[];
  isPinned: boolean;
  publishedAt: Date;
  author?: User;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalRevenue: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: Date;
  user?: User;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  featureFlag?: string;
  badge?: string | number;
  children?: NavItem[];
  superAdminOnly?: boolean;
}
