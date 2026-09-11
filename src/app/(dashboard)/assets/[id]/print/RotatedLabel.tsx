/**
 * Renders `text` rotated -90deg (counterclockwise) inside a fixed-size box,
 * so it reads bottom-to-top — matching the physical label orientation.
 * Using an explicit transform (not CSS writing-mode) keeps the rotation
 * direction predictable regardless of browser/font rendering quirks.
 *
 * boxHeight is the box's height BEFORE rotation, which becomes the text's
 * visual reading length after rotation — keep it under the tape's usable
 * height (e.g. "28mm" on a 36mm tape) so nothing gets clipped.
 */
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
