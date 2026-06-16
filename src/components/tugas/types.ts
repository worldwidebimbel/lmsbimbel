export interface AssignmentClass {
  id: string;
  name: string;
}

export interface AssignmentTeacher {
  id: string;
  name: string | null;
}

export interface SubmissionStudent {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  score: number | null;
  feedback: string | null;
  submittedAt: Date | string;
  gradedAt: Date | string | null;
  student?: SubmissionStudent;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  teacherId: string;
  dueDate: Date | string;
  maxScore: number;
  fileUrl: string | null;
  isPublished: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  class?: AssignmentClass;
  teacher?: AssignmentTeacher;
  submissions?: SubmissionItem[];
  _count?: { submissions: number };
}
