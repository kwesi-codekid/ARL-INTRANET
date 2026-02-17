/**
 * Alert Popup Modal Component
 * Task: 1.2.3.2.2 - Create alert popup modal component
 * Task: 1.2.3.2.3 - Implement severity-based styling
 * Task: 1.2.3.2.4 - Add dismiss functionality with local storage
 * Task: 1.2.3.2.5 - Implement auto-display on page load for new alerts
 * Task: 1.2.3.2.7 - Add alert sound notification option
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { AlertTriangle, AlertCircle, Info, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import type { SerializedAlert } from "~/lib/services/alert.server";
import { playAlertSound } from "./alertSound";

interface AlertPopupProps {
  alerts: SerializedAlert[];
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (alertId: string) => void;
}

const severityConfig = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    chipColor: "danger" as const,
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    chipColor: "warning" as const,
    icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    chipColor: "primary" as const,
    icon: Info,
  },
};

const typeLabels: Record<string, string> = {
  safety: "Safety Alert",
  incident: "Incident Alert",
  general: "General Notice",
  maintenance: "Maintenance",
  weather: "Weather Alert",
};

export function AlertPopup({ alerts, isOpen, onClose, onAcknowledge }: AlertPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  const popupAlerts = alerts.filter((alert) => alert.showPopup);

  // Play sound when popup opens for alerts with playSound enabled
  useEffect(() => {
    if (isOpen && soundEnabled && popupAlerts.length > 0 && !hasPlayedSound) {
      const currentAlert = popupAlerts[currentIndex];
      if (currentAlert?.playSound) {
        playAlertSound(currentAlert.severity);
        setHasPlayedSound(true);
      }
    }
  }, [isOpen, currentIndex, soundEnabled, popupAlerts, hasPlayedSound]);

  // Reset sound played state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setHasPlayedSound(false);
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (currentIndex < popupAlerts.length - 1) {
      const nextAlert = popupAlerts[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      // Play sound for next alert if enabled
      if (soundEnabled && nextAlert?.playSound) {
        playAlertSound(nextAlert.severity);
      }
    }
  }, [currentIndex, popupAlerts, soundEnabled]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevAlert = popupAlerts[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      // Play sound for previous alert if enabled
      if (soundEnabled && prevAlert?.playSound) {
        playAlertSound(prevAlert.severity);
      }
    }
  }, [currentIndex, popupAlerts, soundEnabled]);

  const handleAcknowledge = () => {
    const currentAlert = popupAlerts[currentIndex];
    if (currentAlert) {
      // Store acknowledgment in localStorage
      const acknowledged = JSON.parse(
        localStorage.getItem("acknowledgedAlerts") || "[]"
      );
      if (!acknowledged.includes(currentAlert.id)) {
        acknowledged.push(currentAlert.id);
        localStorage.setItem("acknowledgedAlerts", JSON.stringify(acknowledged));
      }
      onAcknowledge?.(currentAlert.id);
    }

    // Move to next alert or close
    if (currentIndex < popupAlerts.length - 1) {
      handleNext();
    } else {
      onClose();
    }
  };

  if (popupAlerts.length === 0) return null;

  const currentAlert = popupAlerts[currentIndex];
  if (!currentAlert) return null;

  const config = severityConfig[currentAlert.severity];
  const Icon = config.icon;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        classNames={{
          base: `${config.bg} ${config.border} border-2`,
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${config.iconBg}`}>
                <Icon size={24} className={config.iconColor} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" color={config.chipColor} variant="flat">
                    {currentAlert.severity.toUpperCase()}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {typeLabels[currentAlert.type] || currentAlert.type}
                  </Chip>
                </div>
                <h3 className="font-bold text-lg mt-1">{currentAlert.title}</h3>
              </div>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>
          </ModalHeader>

          <ModalBody>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{currentAlert.message}</p>
            </div>

            {currentAlert.startDate && (
              <p className="text-xs text-gray-500 mt-4">
                Posted: {new Date(currentAlert.startDate).toLocaleString()}
              </p>
            )}
          </ModalBody>

          <ModalFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              {popupAlerts.length > 1 && (
                <>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={handlePrev}
                    isDisabled={currentIndex === 0}
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <span className="text-sm text-gray-500">
                    {currentIndex + 1} of {popupAlerts.length}
                  </span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={handleNext}
                    isDisabled={currentIndex === popupAlerts.length - 1}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
              <Button
                color={config.chipColor}
                onPress={handleAcknowledge}
              >
                {currentIndex < popupAlerts.length - 1
                  ? "Acknowledge & Next"
                  : "I Understand"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default AlertPopup;
