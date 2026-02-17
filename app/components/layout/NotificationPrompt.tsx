import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@heroui/react";
import { usePushNotifications } from "~/hooks";

export function NotificationPrompt() {
  const { shouldPrompt, subscribe, dismissPrompt } = usePushNotifications();

  return (
    <AnimatePresence>
      {shouldPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg"
        >
          <div className="relative flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <Bell size={20} className="text-primary-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Stay updated!
              </p>
              <p className="text-xs text-gray-500">
                Enable notifications to get notified about news, events, and
                alerts.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="light"
                onPress={dismissPrompt}
                className="text-gray-500"
              >
                Not now
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={subscribe}
              >
                Enable
              </Button>
            </div>
            <button
              onClick={dismissPrompt}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
