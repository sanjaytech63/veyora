"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { SOCKET_EVENTS } from "@veyora/config";
import { NotificationDto } from "@veyora/types";
import { toast } from "sonner";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = React.createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Only connect when authenticated with active session
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000";

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // 1. Listen for new personal notifications
    newSocket.on(
      SOCKET_EVENTS.SERVER_TO_CLIENT.NOTIFICATION_NEW,
      (notification: NotificationDto) => {
        // Show gentle in-app notification toast
        toast.info(notification.title, {
          description: notification.message,
        });

        // Refresh queries
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      }
    );

    // 2. Listen for unread count updates
    newSocket.on(SOCKET_EVENTS.SERVER_TO_CLIENT.NOTIFICATION_UNREAD_COUNT, () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    });

    // 3. Listen for order status transitions
    newSocket.on(
      SOCKET_EVENTS.SERVER_TO_CLIENT.ORDER_UPDATED,
      (orderData: { orderNumber: string; status: string }) => {
        toast.success(`Order #${orderData.orderNumber} Status Updated`, {
          description: `Current atelier status: ${orderData.status.toUpperCase()}`,
        });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["order"] });
      }
    );

    // 4. Listen for shipment dispatch updates
    newSocket.on(
      SOCKET_EVENTS.SERVER_TO_CLIENT.SHIPMENT_UPDATED,
      (shipmentData: { trackingNumber: string; status: string }) => {
        toast.info("Shipment Transit Update", {
          description: `AWB #${shipmentData.trackingNumber}: ${shipmentData.status}`,
        });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["order"] });
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => React.useContext(SocketContext);
