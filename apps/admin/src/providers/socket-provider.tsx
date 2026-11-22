"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS } from "@veyora/config";
import { toast } from "sonner";

interface AdminSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const AdminSocketContext = React.createContext<AdminSocketContextValue>({
  socket: null,
  isConnected: false,
});

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
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

    // 1. Listen for incoming new orders
    newSocket.on(
      SOCKET_EVENTS.SERVER_TO_CLIENT.ADMIN_ORDER_NEW,
      (orderData: { orderNumber: string; total?: number }) => {
        toast.info("New Couture Reservation Placed", {
          description: `Order #${orderData.orderNumber} - Authorized total: ₹${orderData.total || 0}`,
        });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-unfulfilled-orders"] });
      }
    );

    // 2. Listen for order updates
    newSocket.on(SOCKET_EVENTS.SERVER_TO_CLIENT.ORDER_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unfulfilled-orders"] });
    });

    // 3. Listen for payment updates
    newSocket.on(SOCKET_EVENTS.SERVER_TO_CLIENT.PAYMENT_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    });

    // 4. Listen for shipment dispatch updates
    newSocket.on(SOCKET_EVENTS.SERVER_TO_CLIENT.SHIPMENT_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    });

    // 5. Listen for inventory updates
    newSocket.on(SOCKET_EVENTS.SERVER_TO_CLIENT.ADMIN_INVENTORY_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [queryClient]);

  return (
    <AdminSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </AdminSocketContext.Provider>
  );
}

export const useAdminSocket = () => React.useContext(AdminSocketContext);
