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

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [activeConversation, notifyScreenshot]);
}
