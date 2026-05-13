import { useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";

export function useScreenshotDetection() {
    const { notifyScreenshot, activeConversation } = useChat();

    useEffect(() => {
        if (!activeConversation) return;

        const handleKeyDown = (e) => {
            // 1. Detect PrintScreen key
            if (e.key === "PrintScreen") {
                notifyScreenshot();
            }

            // 2. Detect common screenshot shortcuts
            // Win + Shift + S (Windows)
            if (e.shiftKey && (e.metaKey || e.key === "OS") && e.key === "S") {
                notifyScreenshot();
            }

            // Cmd + Shift + 3 or 4 (macOS)
            if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) {
                notifyScreenshot();
            }
        };

        const handleKeyUp = (e) => {
            // PrintScreen often triggers on keyup in some browsers
            if (e.key === "PrintScreen") {
                notifyScreenshot();
            }
        };

        // 3. Detect focus loss (unreliable but common heuristic)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Many screenshot tools cause the window to lose focus/visibility
                // We don't notify here by default to avoid false positives,
                // but we could if we wanted a "strict" mode.
            }
        };

        // 4. Detect mobile 3-finger swipe gesture
        let touchStartY = 0;
        let hasNotifiedForCurrentGesture = false;

        const handleTouchStart = (e) => {
            if (e.touches.length === 3) {
                touchStartY = e.touches[0].clientY;
                hasNotifiedForCurrentGesture = false;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 3 && !hasNotifiedForCurrentGesture) {
                const touchCurrentY = e.touches[0].clientY;
                const diffY = touchCurrentY - touchStartY;
                
                // If swiped down more than 30px with 3 fingers, it's likely a screenshot gesture
                if (diffY > 30) {
                    notifyScreenshot();
                    hasNotifiedForCurrentGesture = true; // Prevent multiple notifications for one swipe
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [activeConversation, notifyScreenshot]);
}
