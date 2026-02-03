/**
 * Alert Container Component
 * Integrates AlertBanner and AlertPopup with the AlertProvider context
 * Task: 1.2.3.2.5 - Implement auto-display on page load for new alerts
 */

import { useAlerts } from "./AlertProvider";
import { AlertBanner } from "./AlertBanner";
import { AlertPopup } from "./AlertPopup";
import { AlertToast } from "./AlertToast";

interface AlertContainerProps {
  showBanner?: boolean;
  showPopup?: boolean;
  showToast?: boolean;
}

export function AlertContainer({
  showBanner = true,
  showPopup = true,
  showToast = false,
}: AlertContainerProps) {
  const {
    bannerAlerts,
    popupAlerts,
    isPopupOpen,
    closePopup,
    acknowledgeAlert,
    dismissBannerAlert,
  } = useAlerts();

  return (
    <>
      {/* Banner at top of page */}
      {showBanner && bannerAlerts.length > 0 && (
        <AlertBanner alerts={bannerAlerts} onDismiss={dismissBannerAlert} />
      )}

      {/* Popup modal */}
      {showPopup && (
        <AlertPopup
          alerts={popupAlerts}
          isOpen={isPopupOpen}
          onClose={closePopup}
          onAcknowledge={acknowledgeAlert}
        />
      )}

      {/* Toast notifications */}
      {showToast && popupAlerts.length > 0 && (
        <AlertToast
          alerts={popupAlerts.map((a) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            severity: a.severity,
            type: a.type,
          }))}
        />
      )}
    </>
  );
}

export default AlertContainer;
