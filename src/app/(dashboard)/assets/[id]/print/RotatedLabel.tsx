export function RotatedLabel({
  text,
  children,
  boxWidth,
  boxHeight,
  fontSizeMm,
  bold = false,
  mono = false,
}: {
  text?: string;
  children?: React.ReactNode;
  boxWidth: string;
  boxHeight: string;
  fontSizeMm?: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{ width: boxWidth, height: boxHeight, position: "relative", flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-90deg)",
          whiteSpace: "nowrap",
          fontSize: fontSizeMm,
          fontWeight: bold ? 600 : 400,
          fontFamily: mono ? "var(--font-plex-mono)" : undefined,
        }}
      >
        {children ?? text}
      </div>
    </div>
  );
}
