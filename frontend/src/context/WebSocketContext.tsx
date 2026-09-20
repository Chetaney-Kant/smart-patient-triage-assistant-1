import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export interface LiveTriageMessage {
  eventType: string;
  sessionId: number;
  sessionCode: string;
  patientName: string;
  priority: string;
  status: string;
  primarySymptom: string;
  triggeredRule?: string;
  requiresAttention: boolean;
  timestamp: string;
}

interface WebSocketContextType {
  connected: boolean;
  lastEvent: LiveTriageMessage | null;
  emergencyAlert: LiveTriageMessage | null;
  clearEmergencyAlert: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveTriageMessage | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState<LiveTriageMessage | null>(null);
  const stompClientRef = useRef<Stomp.Client | null>(null);

  useEffect(() => {
    let socket: any = null;
    let client: Stomp.Client | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        socket = new SockJS('/ws');
        client = Stomp.over(socket);
        client.debug = () => {}; // Silence verbose debug logs

        client.connect(
          {},
          () => {
            setConnected(true);
            stompClientRef.current = client;

            // Subscribe to live triage updates
            client?.subscribe('/topic/triage-queue', (message) => {
              try {
                const payload: LiveTriageMessage = JSON.parse(message.body);
                setLastEvent(payload);
              } catch (e) {
                console.warn('Error parsing triage queue message', e);
              }
            });

            // Subscribe to high-priority emergency alerts
            client?.subscribe('/topic/emergency-alerts', (message) => {
              try {
                const payload: LiveTriageMessage = JSON.parse(message.body);
                setEmergencyAlert(payload);
              } catch (e) {
                console.warn('Error parsing emergency alert message', e);
              }
            });
          },
          (error) => {
            setConnected(false);
            reconnectTimeout = setTimeout(connectWs, 5000);
          }
        );
      } catch (err) {
        setConnected(false);
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (client && client.connected) {
        try {
          client.disconnect(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const clearEmergencyAlert = () => setEmergencyAlert(null);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        lastEvent,
        emergencyAlert,
        clearEmergencyAlert,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};
