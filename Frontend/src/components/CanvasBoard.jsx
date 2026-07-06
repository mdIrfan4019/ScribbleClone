import { useSocket } from "../context/SocketContext";
import { useCanvas } from "../hooks/useCanvas";

// Color Palette for Drawer
const COLORS = [
  "#000000", // Black
  "#ffffff", // White
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#78350f"  // Brown
];

export default function CanvasBoard() {
  const { isDrawer, roomState } = useSocket();
  const {
    canvasRef,
    drawColor,
    setDrawColor,
    brushSize,
    setBrushSize,
    activeTool,
    setActiveTool,
    startDrawing,
    drawMove,
    endDrawing,
    undoDraw,
    clearDraw
  } = useCanvas(isDrawer, roomState?.state);

  return (
    <>
      {/* Drawing Canvas Frame */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="canvas-element"
          onMouseDown={startDrawing}
          onMouseMove={drawMove}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />
      </div>

      {/* Drawer Drawing Toolbar */}
      <div className="canvas-toolbar glass-panel" style={{ visibility: isDrawer ? "visible" : "hidden" }}>
        <div className="toolbar-group">
          <span className="form-label" style={{ fontSize: "11px" }}>Brush:</span>
          <div className="color-swatch-list">
            {COLORS.map((col) => (
              <div
                key={col}
                className={`color-swatch ${drawColor === col && activeTool === "brush" ? "active" : ""}`}
                style={{ backgroundColor: col }}
                onClick={() => {
                  setDrawColor(col);
                  setActiveTool("brush");
                }}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`brush-size-btn ${brushSize === 2 ? "active" : ""}`}
            onClick={() => setBrushSize(2)}
            title="Thin Brush"
          >
            <div className="brush-indicator" style={{ width: "4px", height: "4px" }} />
          </button>
          <button
            type="button"
            className={`brush-size-btn ${brushSize === 6 ? "active" : ""}`}
            onClick={() => setBrushSize(6)}
            title="Medium Brush"
          >
            <div className="brush-indicator" style={{ width: "8px", height: "8px" }} />
          </button>
          <button
            type="button"
            className={`brush-size-btn ${brushSize === 12 ? "active" : ""}`}
            onClick={() => setBrushSize(12)}
            title="Thick Brush"
          >
            <div className="brush-indicator" style={{ width: "14px", height: "14px" }} />
          </button>
          <button
            type="button"
            className={`brush-size-btn ${brushSize === 24 ? "active" : ""}`}
            onClick={() => setBrushSize(24)}
            title="Huge Brush"
          >
            <div className="brush-indicator" style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`glow-btn glow-btn-outline ${activeTool === "eraser" ? "glow-btn-secondary" : ""}`}
            style={{ padding: "6px 12px", fontSize: "13px" }}
            onClick={() => setActiveTool(activeTool === "eraser" ? "brush" : "eraser")}
          >
            🧽 Eraser
          </button>
          <button
            type="button"
            className="glow-btn glow-btn-outline"
            style={{ padding: "6px 12px", fontSize: "13px" }}
            onClick={undoDraw}
          >
            ↩ Undo
          </button>
          <button
            type="button"
            className="glow-btn glow-btn-outline"
            style={{ padding: "6px 12px", fontSize: "13px" }}
            onClick={clearDraw}
          >
            🗑 Clear
          </button>
        </div>
      </div>
    </>
  );
}
