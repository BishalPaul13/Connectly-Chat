import { cn } from "@/lib/utils";

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
};

const statusSizeClasses = {
    sm: "w-2.5 h-2.5 right-0 bottom-0",
    md: "w-3 h-3 right-0 bottom-0",
    lg: "w-3.5 h-3.5 right-0.5 bottom-0.5",
    xl: "w-4 h-4 right-1 bottom-1",
};

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getColorFromName(name) {
    const colors = [
        "bg-primary",
        "bg-blue-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-orange-500",
        "bg-teal-500",
        "bg-indigo-500",
        "bg-rose-500",
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

export function Avatar({ src, name, size = "md", isOnline, className }) {
    return (
        <div className={cn("relative inline-flex flex-shrink-0", className)}>
            {src ? (
                <img
                    src={src}
                    alt={name || "Avatar"}
                    className={cn(
                        "rounded-full object-cover ring-2 ring-background",
                        sizeClasses[size]
                    )}
                />
            ) : (
                <div
                    className={cn(
                        "rounded-full flex items-center justify-center font-medium text-primary-foreground ring-2 ring-background",
                        sizeClasses[size],
                        getColorFromName(name)
                    )}
                >
                    {getInitials(name)}
                </div>
            )}
            {isOnline !== undefined && (
                <span
                    className={cn(
                        "absolute rounded-full border-2 border-background",
                        statusSizeClasses[size],
                        isOnline ? "bg-online online-pulse" : "bg-muted-foreground/50"
                    )}
                />
            )}
        </div>
    );
}
