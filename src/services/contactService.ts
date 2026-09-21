import { db } from '../db/database';
import { emitAppData } from '../lib/events';
import { createId } from '../lib/ids';
import type { ContactSubmission } from '../types/models';

export async function saveContact(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactSubmission> {
  const record: ContactSubmission = {
    id: createId('msg'),
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    createdAt: Date.now(),
  };
  await db.contacts.add(record);
  emitAppData();
  return record;
}

export async function listContacts(): Promise<ContactSubmission[]> {
  return db.contacts.orderBy('createdAt').reverse().toArray();
}
