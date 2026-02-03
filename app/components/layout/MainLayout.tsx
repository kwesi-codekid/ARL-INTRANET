import { Header } from "./Header";
import { Footer } from "./Footer";
import { RightSidebar } from "./RightSidebar";
import { ChatWidget } from "../chat/ChatWidget";
import { AlertProvider, AlertContainer } from "../alerts";
import type { SerializedAlert } from "~/lib/services/alert.server";

interface MainLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
  showChatWidget?: boolean;
  showAlerts?: boolean;
  initialAlerts?: SerializedAlert[];
}

export function MainLayout({
  children,
  showRightSidebar = false,
  showChatWidget = true,
  showAlerts = true,
  initialAlerts = [],
}: MainLayoutProps) {
  return (
    <AlertProvider initialAlerts={initialAlerts}>
      <div className="flex min-h-screen flex-col bg-gray-100">
        {/* Alert banner at the very top */}
        {showAlerts && <AlertContainer showBanner={true} showPopup={true} />}
        <Header />
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start gap-6 px-4 py-6 pb-24 lg:pb-6">
          <main className="min-w-0 flex-1">{children}</main>
          {showRightSidebar && <RightSidebar />}
        </div>
        <Footer />
        {showChatWidget && <ChatWidget />}
      </div>
    </AlertProvider>
  );
}
