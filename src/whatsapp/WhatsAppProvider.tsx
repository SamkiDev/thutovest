import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  alertsBetween,
  DEFAULT_ALERTS,
  handleMessage,
  newLinkCode,
  type BotSnapshot,
} from '../../supabase/functions/_shared/whatsapp/bot.ts';
import { useStudentContext } from '../hooks/useStudent';
import { usePlatform } from '../platform/PlatformProvider';
import { dataStore } from '../platform/dataStore';
import { buildSnapshot } from './snapshot';

export interface ChatMessage {
  id: string;
  from: 'bot' | 'me';
  text: string;
  at: string;
  alert?: boolean;
}

interface ChatStore {
  messages: ChatMessage[];
  last: BotSnapshot | null;
  unread: number;
}

interface WhatsAppValue {
  snapshot: BotSnapshot | null;
  messages: ChatMessage[];
  unread: number;
  typing: boolean;
  linked: boolean;
  send: (text: string) => void;
  requestCode: (phone: string) => { code: string; expiresAt: string };
  markRead: () => void;
  clearChat: () => void;
}

const Ctx = createContext<WhatsAppValue | null>(null);
const EMPTY: ChatStore = { messages: [], last: null, unread: 0 };
const MAX_MESSAGES = 120;
const id = () => `wa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const comparable = (s: BotSnapshot) => JSON.stringify({ ...s, generatedAt: '' });

/**
 * Runs the WhatsApp companion inside the student app: keeps the simulated
 * chat, and sends alerts when offers, documents, payments, messages or
 * deadlines change, exactly as the real bot would.
 */
export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const { state, engine, dispatch } = useStudentContext();
  const { platform } = usePlatform();
  const key = state ? `whatsapp:${state.id}` : null;
  const [store, setStore] = useState<ChatStore>(() => (key ? dataStore.load<ChatStore>(key) : null) ?? EMPTY);
  const [typing, setTyping] = useState(false);
  const storeRef = useRef(store);
  storeRef.current = store;

  // A different student on this device (demo reset, new profile) has their own chat.
  const loadedKey = useRef(key);
  useEffect(() => {
    if (loadedKey.current === key) return;
    loadedKey.current = key;
    setStore((key ? dataStore.load<ChatStore>(key) : null) ?? EMPTY);
  }, [key]);

  const snapshot = useMemo(() => (state && engine ? buildSnapshot(state, engine, platform) : null), [state, engine, platform]);
  const snapKey = snapshot ? comparable(snapshot) : '';
  const wa = state?.whatsapp;
  const linked = Boolean(wa?.linkedAt);

  const update = useCallback(
    (fn: (s: ChatStore) => ChatStore) => {
      setStore((prev) => {
        const next = fn(prev);
        const trimmed = { ...next, messages: next.messages.slice(-MAX_MESSAGES) };
        if (key) dataStore.save(key, trimmed);
        return trimmed;
      });
    },
    [key],
  );

  // Alerts: compare the new snapshot with the last one the bot saw.
  useEffect(() => {
    if (!snapshot) return;
    if (!linked || wa?.optedOut) {
      if (storeRef.current.last) update((s) => ({ ...s, last: null }));
      return;
    }
    const prev = storeRef.current.last;
    if (prev && comparable(prev) === snapKey) return;
    const alerts = alertsBetween(prev, snapshot, wa?.alerts ?? DEFAULT_ALERTS);
    const at = new Date().toISOString();
    update((s) => ({
      messages: [...s.messages, ...alerts.map((text) => ({ id: id(), from: 'bot' as const, text, at, alert: true }))],
      last: snapshot,
      unread: s.unread + alerts.length,
    }));
    // snapKey captures every change that matters; the snapshot object itself is rebuilt each render.
  }, [snapKey, linked, wa?.optedOut, wa?.alerts, update]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || !state) return;
      const at = new Date().toISOString();
      update((s) => ({ ...s, messages: [...s.messages, { id: id(), from: 'me', text: text.slice(0, 500), at }] }));
      const result = handleMessage(text, {
        now: new Date(),
        linked,
        optedOut: Boolean(wa?.optedOut),
        snapshot: snapshot ?? undefined,
        pendingCode: wa?.pending,
        appUrl: `${window.location.origin}${window.location.pathname}`,
      });
      const effect = result.effect;
      if (effect?.type === 'link') {
        dispatch({ type: 'whatsappLinked' });
        update((s) => ({ ...s, last: snapshot }));
      } else if (effect?.type === 'optOut' && wa) {
        dispatch({ type: 'whatsappOptOut', value: true });
      } else if (effect?.type === 'optIn' && wa) {
        dispatch({ type: 'whatsappOptOut', value: false });
      } else if (effect?.type === 'reportScam') {
        dispatch({ type: 'log', text: 'Reported a suspicious message through WhatsApp', kind: 'alert' });
      }
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        const t = new Date().toISOString();
        update((s) => ({ ...s, messages: [...s.messages, ...result.replies.map((r) => ({ id: id(), from: 'bot' as const, text: r, at: t }))] }));
      }, 450);
    },
    [state, wa, linked, snapshot, dispatch, update],
  );

  const requestCode = useCallback(
    (phone: string) => {
      const c = newLinkCode(new Date());
      dispatch({ type: 'whatsappRequestCode', phone, code: c.code, expiresAt: c.expiresAt });
      return c;
    },
    [dispatch],
  );

  const markRead = useCallback(() => {
    if (storeRef.current.unread) update((s) => ({ ...s, unread: 0 }));
  }, [update]);
  const clearChat = useCallback(() => update((s) => ({ ...s, messages: [], unread: 0 })), [update]);

  const value = useMemo(
    () => ({ snapshot, messages: store.messages, unread: store.unread, typing, linked, send, requestCode, markRead, clearChat }),
    [snapshot, store.messages, store.unread, typing, linked, send, requestCode, markRead, clearChat],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWhatsApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWhatsApp must be used inside <WhatsAppProvider>');
  return v;
}
