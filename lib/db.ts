import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getDb } from "./firebase";

/** Firestore rejects `undefined`; a JSON round-trip drops those fields. */
function clean<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export async function loadAll<T>(uid: string, name: string): Promise<(T & { id: string })[]> {
  const snap = await getDocs(collection(getDb(), "users", uid, name));
  return snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T & { id: string });
}

export async function addItem(uid: string, name: string, data: object): Promise<string> {
  const ref = await addDoc(collection(getDb(), "users", uid, name), clean({ ...data, created_at: Date.now() }));
  return ref.id;
}

export async function updateItem(uid: string, name: string, id: string, data: object) {
  await updateDoc(doc(getDb(), "users", uid, name, id), clean(data) as Record<string, unknown>);
}

export async function setItem(uid: string, name: string, id: string, data: object) {
  await setDoc(doc(getDb(), "users", uid, name, id), clean(data));
}

export async function removeItem(uid: string, name: string, id: string) {
  await deleteDoc(doc(getDb(), "users", uid, name, id));
}

/** Add many documents (batched, 400 per commit). */
export async function addMany(uid: string, name: string, rows: object[]) {
  const db = getDb();
  const now = Date.now();
  for (let i = 0; i < rows.length; i += 400) {
    const b = writeBatch(db);
    rows.slice(i, i + 400).forEach((r, j) => {
      b.set(doc(collection(db, "users", uid, name)), clean({ ...r, created_at: now + i + j }));
    });
    await b.commit();
  }
}
