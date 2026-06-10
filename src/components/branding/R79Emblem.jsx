import { R79_EMBLEM_SRC } from "../../data/brandingMeta.js";

/**
 * @param {{ size?: number, glow?: string, ring?: string, pulse?: boolean, className?: string }} props
 */
export default function R79Emblem({
  size = 96,
  glow = "rgba(34, 211, 238, 0.55)",
  ring = "rgba(139, 92, 246, 0.65)",
  pulse = false,
}) {
  return (
    <>
      {pulse ? (
        <style>{`
          @keyframes r79EmblemPulse {
            0%, 100% {
              box-shadow: 0 0 18px ${glow}, 0 0 36px ${glow.replace("0.45", "0.2")};
            }
            50% {
              box-shadow: 0 0 28px ${glow}, 0 0 52px ${glow.replace("0.45", "0.32")};
            }
          }
        `}</style>
      ) : null}
      <div
        style={{
          alignItems: "center",
          animation: pulse ? "r79EmblemPulse 2.8s ease-in-out infinite" : undefined,
          background: "rgba(4, 8, 16, 0.85)",
          border: `2px solid ${ring}`,
          borderRadius: "50%",
          boxShadow: `0 0 24px ${glow}, 0 0 40px rgba(139, 92, 246, 0.15)`,
          display: "flex",
          height: size,
          justifyContent: "center",
          overflow: "hidden",
          width: size,
        }}
      >
        <img
          src={R79_EMBLEM_SRC}
          alt="R79 icon logo"
          style={{
            display: "block",
            height: "92%",
            objectFit: "contain",
            width: "92%",
          }}
        />
      </div>
    </>
  );
}
