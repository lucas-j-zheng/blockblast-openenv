import { useCallback, useEffect, useRef, useState } from 'react';
import type { Observation, ServerMessage } from '../types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [obs, setObs] = useState<Observation | null>(null);

  const connect = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('[WS] connected');
      setConnected(true);
      wsRef.current = ws;
      ws.send(JSON.stringify({ type: 'reset', data: {} }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      console.log('[WS] message:', msg.type);
      if (msg.type === 'observation') {
        // Server sends { observation: { board, score, ... }, reward, done }
        const inner = msg.data.observation ?? msg.data;
        const obs: Observation = {
          ...inner,
          reward: msg.data.reward ?? inner.reward ?? 0,
          done: msg.data.done ?? inner.done ?? false,
        };
        setObs(obs);
      }
    };

    ws.onclose = (e) => {
      console.log('[WS] closed:', e.code, e.reason);
      setConnected(false);
      wsRef.current = null;
      setTimeout(connect, 2000);
    };

    ws.onerror = (e) => {
      console.error('[WS] error:', e);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const reset = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'reset', data: {} }));
  }, []);

  const step = useCallback((blockIndex: number, row: number, col: number) => {
    wsRef.current?.send(JSON.stringify({
      type: 'step',
      data: { block_index: blockIndex, row, col },
    }));
  }, []);

  return { connected, obs, reset, step };
}
