import { useState, useEffect, useRef } from "react";
import { socket } from "../socket.js";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export function useCanvas(isDrawer, gameState) {
  const canvasRef = useRef(null);
  const prevCoordRef = useRef(null);
  const isDrawingLocal = useRef(false);
  const strokesHistoryRef = useRef([]);

  // Toolbar state
  const [drawColor, setDrawColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [activeTool, setActiveTool] = useState("brush"); // brush, eraser

  // Coordinate mapping function: maps visual click/touch to internal 800x500 space
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const xPercent = (clientX - rect.left) / rect.width;
    const yPercent = (clientY - rect.top) / rect.height;

    return {
      x: Math.round(xPercent * CANVAS_WIDTH),
      y: Math.round(yPercent * CANVAS_HEIGHT)
    };
  };

  // Redraw all strokes in history ref onto the canvas context
  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    strokesHistoryRef.current.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.size;

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.closePath();
    });
  };

  // Local drawing actions (emitted to server)
  const startDrawing = (e) => {
    if (!isDrawer || gameState !== "DRAWING") return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    isDrawingLocal.current = true;
    prevCoordRef.current = coords;

    socket.emit("draw_start", {
      x: coords.x,
      y: coords.y,
      color: drawColor,
      size: brushSize,
      tool: activeTool
    });
  };

  const drawMove = (e) => {
    if (!isDrawer || !isDrawingLocal.current || gameState !== "DRAWING") return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    socket.emit("draw_move", { x: coords.x, y: coords.y });
  };

  const endDrawing = (e) => {
    if (!isDrawer || !isDrawingLocal.current) return;
    e.preventDefault();

    isDrawingLocal.current = false;
    prevCoordRef.current = null;
    socket.emit("draw_end");
  };

  const undoDraw = () => {
    if (!isDrawer) return;
    socket.emit("draw_undo");
  };

  const clearDraw = () => {
    if (!isDrawer) return;
    socket.emit("canvas_clear");
  };

  // Redraw hook on window resize or phase transition
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      redrawAllStrokes();
    }
  }, [gameState]);

  // Bind server socket drawing listeners
  useEffect(() => {
    const handleDrawStartServer = ({ x, y, color, size, tool }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      strokesHistoryRef.current.push({
        tool,
        color,
        size,
        points: [{ x, y }]
      });

      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = size;
      ctx.moveTo(x, y);

      prevCoordRef.current = { x, y };
    };

    const handleDrawMoveServer = ({ x, y }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const history = strokesHistoryRef.current;
      if (history.length > 0) {
        history[history.length - 1].points.push({ x, y });
      }

      if (prevCoordRef.current) {
        ctx.lineTo(x, y);
        ctx.stroke();
        prevCoordRef.current = { x, y };
      }
    };

    const handleDrawEndServer = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.closePath();
      prevCoordRef.current = null;
    };

    const handleCanvasClearServer = () => {
      strokesHistoryRef.current = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const handleDrawUndoServer = () => {
      strokesHistoryRef.current.pop();
      redrawAllStrokes();
    };

    const handleRoundStartServer = () => {
      strokesHistoryRef.current = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    socket.on("draw_start", handleDrawStartServer);
    socket.on("draw_move", handleDrawMoveServer);
    socket.on("draw_end", handleDrawEndServer);
    socket.on("canvas_clear", handleCanvasClearServer);
    socket.on("draw_undo", handleDrawUndoServer);
    socket.on("round_start", handleRoundStartServer);

    return () => {
      socket.off("draw_start", handleDrawStartServer);
      socket.off("draw_move", handleDrawMoveServer);
      socket.off("draw_end", handleDrawEndServer);
      socket.off("canvas_clear", handleCanvasClearServer);
      socket.off("draw_undo", handleDrawUndoServer);
      socket.off("round_start", handleRoundStartServer);
    };
  }, []);

  return {
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
    clearDraw,
    redrawAllStrokes
  };
}
