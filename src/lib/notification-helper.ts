import { db } from "@/lib/db";

type TemplateVars = Record<string, string | number | undefined>;

export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
  });
}

export async function getTemplate(code: string) {
  return db.notificationTemplate.findUnique({ where: { code } });
}

export async function sendNotificationFromTemplate(
  code: string,
  recipient: string,
  vars: TemplateVars,
  userId?: string,
) {
  const template = await getTemplate(code);
  if (!template || !template.isActive) return null;

  const renderedBody = renderTemplate(template.body, vars);
  const renderedSubject = template.subject ? renderTemplate(template.subject, vars) : null;

  const log = await db.notificationLog.create({
    data: {
      templateId: template.id,
      userId: userId ?? null,
      channel: template.channel,
      recipient,
      subject: renderedSubject,
      body: renderedBody,
      status: "SENT",
      sentAt: new Date(),
    },
  });

  if (userId) {
    await db.notification.create({
      data: {
        userId,
        title: renderedSubject ?? template.name,
        content: renderedBody,
        type: "INFO",
      },
    });
  }

  return log;
}

export async function sendInAppNotification(
  userId: string,
  title: string,
  content: string,
  link?: string,
) {
  await db.notification.create({
    data: { userId, title, content, type: "INFO", link },
  });
}
