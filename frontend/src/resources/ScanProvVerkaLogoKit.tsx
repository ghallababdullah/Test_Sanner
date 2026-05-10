import type { CSSProperties } from "react";

export const scanProvVerkaColors = {
  primaryBlue: "#0052cc",
  secondaryBlue: "#0077ff",
  successGreen: "#10b981",
  lightBg: "#f0f4ff"
};

export function ScanProvVerkaIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" fill={scanProvVerkaColors.lightBg} />
      <circle cx="100" cy="100" r="95" fill="none" stroke={scanProvVerkaColors.primaryBlue} strokeWidth="2.5" />
      <rect
        x="60"
        y="40"
        width="80"
        height="110"
        rx="5"
        fill={scanProvVerkaColors.primaryBlue}
        opacity="0.08"
        stroke={scanProvVerkaColors.primaryBlue}
        strokeWidth="2"
      />
      <line x1="75" y1="65" x2="125" y2="65" stroke={scanProvVerkaColors.secondaryBlue} strokeWidth="3" strokeLinecap="round" />
      <line
        x1="75"
        y1="85"
        x2="125"
        y2="85"
        stroke={scanProvVerkaColors.secondaryBlue}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="75"
        y1="105"
        x2="115"
        y2="105"
        stroke={scanProvVerkaColors.secondaryBlue}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="125" cy="145" r="15" fill={scanProvVerkaColors.successGreen} />
      <path d="M 120 145 L 123 148 L 130 141" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScanProvVerkaWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      style={{
        fontSize: compact ? "18px" : "20px",
        fontWeight: 800,
        color: scanProvVerkaColors.primaryBlue,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        display: "inline-block"
      }}
    >
      СканПроверка
    </span>
  );
}

export function ScanProvVerkaLogoHorizontal({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <ScanProvVerkaIcon size={56} />
      <div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: scanProvVerkaColors.primaryBlue,
            letterSpacing: "-0.04em",
            lineHeight: 1
          }}
        >
          СканПроверка
        </div>
        {showTagline ? (
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Автоматизация проверки документов
          </div>
        ) : null}
      </div>
    </div>
  );
}

const kitContainerStyle: CSSProperties = {
  padding: "40px 20px",
  maxWidth: "1200px",
  margin: "0 auto",
  fontFamily: "system-ui, -apple-system, sans-serif"
};

export default function ScanProvVerkaLogoKit() {
  return (
    <div style={kitContainerStyle}>
      <h1 style={{ fontSize: "42px", marginBottom: "10px", color: scanProvVerkaColors.primaryBlue }}>СканПроверка</h1>
      <p style={{ fontSize: "16px", color: "#666", marginBottom: "40px" }}>
        Логотип и фирменный стиль для платформы автоматизации проверки бланков
      </p>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          display: "grid",
          gap: "24px"
        }}
      >
        <ScanProvVerkaLogoHorizontal />
        <ScanProvVerkaWordmark />
        <ScanProvVerkaIcon size={96} />
      </div>
    </div>
  );
}
