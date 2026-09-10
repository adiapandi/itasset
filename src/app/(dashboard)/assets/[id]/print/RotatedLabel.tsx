export function RotatedLabel({
  text,
  boxHeight,
  fontSizeMm,
  bold = false,
  mono = false,
}: {
  text: string;
  boxHeight: string;
  fontSizeMm: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{ width: fontSizeMm, height: boxHeight, position: "relative", flexShrink: 0 }}>
      <span
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
        {text}
      </span>
    </div>
  );
}
