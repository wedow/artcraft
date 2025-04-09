import { useContext } from "react";
import { NotificationContext } from "context";

export default function useNotifications() {
  return useContext(NotificationContext);
};