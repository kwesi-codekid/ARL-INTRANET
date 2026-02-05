import { Header } from "./Header";
import { Footer } from "./Footer";
import { RightSidebar } from "./RightSidebar";
import { BottomNavigation } from "./BottomNavigation";
import { MobileSidebarContent } from "./MobileSidebarContent";
import { ChatWidget } from "../chat/ChatWidget";
import { AlertProvider, AlertContainer } from "../alerts";
import type { SerializedAlert } from "~/lib/services/alert.server";

export interface PortalUser {
  id: string;
  name: string;
  email?: string;
  position?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
  showChatWidget?: boolean;
  showAlerts?: boolean;
  initialAlerts?: SerializedAlert[];
  user?: PortalUser | null;
}

export function MainLayout({
  children,
  showRightSidebar = false,
  showChatWidget = true,
  showAlerts = true,
  initialAlerts = [],
  user = null,
}: MainLayoutProps) {
  return (
    <AlertProvider initialAlerts={initialAlerts}>
      <div className="flex min-h-screen flex-col bg-gray-100">
        {/* Alert banner at the very top */}
        {showAlerts && <AlertContainer showBanner={true} showPopup={true} />}
        <Header user={user} />
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start gap-6 px-4 py-6 pb-24 lg:pb-6">
          <main className="min-w-0 flex-1">
            {children}
            {/* Mobile sidebar content - shows below main content on mobile */}
            {showRightSidebar && <MobileSidebarContent />}
          </main>
          {showRightSidebar && <RightSidebar />}
        </div>
        <Footer />
        <BottomNavigation />
        {showChatWidget && <ChatWidget />}
      </div>
    </AlertProvider>
  );
}
