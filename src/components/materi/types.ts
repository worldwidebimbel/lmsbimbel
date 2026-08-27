export type MaterialSubject = { id: string; name: string; color: string; code: string };
export type MaterialClass = { id: string; name: string };

export type MaterialItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string | null;
  isPublished: boolean;
  order: number;
  chapterTitle?: string | null;
  chapterOrder?: number;
  content?: string | null;
  keyPoints?: string[] | null;
  tips?: string | null;
  slideCount?: number | null;
  createdAt: Date | string;
  subject: MaterialSubject | null;
  class: MaterialClass | null;
  _count: { progress: number };
};
