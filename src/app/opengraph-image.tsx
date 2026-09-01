import { ImageResponse } from "next/og";

export const alt = "Play SE!ZE online — a two-player strategy game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const board = [
  makeRow("north", [0, 1, 1, 1, 0]),
  makeRow("upper", [1, 1, 2, 1, 1]),
  makeRow("center", [1, 3, 3, 2, 1]),
  makeRow("lower", [1, 1, 2, 1, 1]),
  makeRow("south", [0, 1, 1, 1, 0]),
];

function makeRow(id: string, kinds: number[]) {
  return {
    id,
    cells: kinds.map((kind, column) => ({ id: `${id}-${column}`, kind })),
  };
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 20% 0%, #7d1830 0%, #210d12 48%, #090708 100%)",
        color: "#f7e8ca",
        display: "flex",
        fontFamily: "serif",
        height: "100%",
        justifyContent: "space-between",
        padding: "64px 78px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 690 }}>
        <div
          style={{
            color: "#d8b86c",
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: 20,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Free two-player strategy game
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 150,
            letterSpacing: 12,
            lineHeight: 1,
            marginTop: 30,
          }}
        >
          SE<span style={{ color: "#d83c59" }}>!</span>ZE
        </div>
        <div
          style={{
            color: "#cbb99f",
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: 31,
            lineHeight: 1.35,
            marginTop: 28,
          }}
        >
          16 PIECES · 2 BOSSES · 3 WAYS TO WIN
        </div>
        <div
          style={{
            color: "#9c8768",
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: 22,
            marginTop: 42,
          }}
        >
          playseze.com
        </div>
      </div>

      <div
        style={{
          background: "#242223",
          border: "3px solid #44383b",
          borderRadius: 22,
          display: "flex",
          flexDirection: "column",
          padding: 12,
          boxShadow: "0 18px 48px rgba(0, 0, 0, 0.38)",
          transform: "rotate(4deg)",
        }}
      >
        {board.map((row, rowIndex) => (
          <div key={row.id} style={{ display: "flex" }}>
            {row.cells.map((cell, columnIndex) => (
              <div
                key={cell.id}
                style={{
                  alignItems: "center",
                  background:
                    cell.kind === 0
                      ? "transparent"
                      : (rowIndex + columnIndex) % 2 === 0
                        ? "#d8d2c8"
                        : "#303534",
                  display: "flex",
                  height: 62,
                  justifyContent: "center",
                  width: 62,
                }}
              >
                {cell.kind >= 2 ? (
                  <div
                    style={{
                      background: cell.kind === 2 ? "#741426" : "#e6c83e",
                      border: "3px solid #b68b42",
                      borderRadius: 999,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.34)",
                      display: "flex",
                      height: 40,
                      width: 40,
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
