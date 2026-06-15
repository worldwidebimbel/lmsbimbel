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
  createdAt: Date | string;
  subject: MaterialSubject | null;
  class: MaterialClass | null;
  _count: { progress: number };
};
