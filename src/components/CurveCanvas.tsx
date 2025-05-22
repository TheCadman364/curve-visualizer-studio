
import React, { useEffect, useRef, useState } from "react";
import { CurveType, Point } from "../types";

interface CurveCanvasProps {
  controlPoints: Point[];
  curvePoints: Point[];
  drawPolygon: boolean;
  drawTangents: boolean;
  width?: number;
  height?: number;
  onControlPointMove?: (index: number, point: Point) => void;
  tangentPoints?: Point[];
  curveType: CurveType;
  highlightPoint?: Point;
}

const CurveCanvas: React.FC<CurveCanvasProps> = ({
  controlPoints,
  curvePoints,
  drawPolygon,
  drawTangents,
  width = 600,
  height = 400,
  onControlPointMove,
  tangentPoints = [],
  curveType,
  highlightPoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Calculate scale and offset for the canvas
  useEffect(() => {
    if (controlPoints.length === 0) return;
    
    // Find bounds of all points
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    [...controlPoints, ...curvePoints].forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    
    // Add padding
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate scale and offset
    const scaleX = width / (maxX - minX) || 1;
    const scaleY = height / (maxY - minY) || 1;
    
    // Use the same scale factor for x and y to maintain aspect ratio
    const newScale = Math.min(scaleX, scaleY);
    
    setScale({ x: newScale, y: newScale });
    setOffset({
      x: -minX * newScale + (width - (maxX - minX) * newScale) / 2,
      y: -minY * newScale + (height - (maxY - minY) * newScale) / 2
    });
  }, [controlPoints, curvePoints, width, height]);

  // Transform from world to screen coordinates
  const worldToScreen = (point: Point): Point => {
    return {
      x: point.x * scale.x + offset.x,
      y: point.y * scale.y + offset.y,
    };
  };
  
  // Transform from screen to world coordinates
  const screenToWorld = (point: Point): Point => {
    return {
      x: (point.x - offset.x) / scale.x,
      y: (point.y - offset.y) / scale.y,
    };
  };

  // Check if mouse is over a point
  const isMouseOverPoint = (mouseX: number, mouseY: number, point: Point): boolean => {
    const screenPoint = worldToScreen(point);
    const threshold = 10; // pixels
    return (
      Math.abs(mouseX - screenPoint.x) < threshold &&
      Math.abs(mouseY - screenPoint.y) < threshold
    );
  };

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onControlPointMove) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if mouse is over any control point
    for (let i = 0; i < controlPoints.length; i++) {
      if (isMouseOverPoint(mouseX, mouseY, controlPoints[i])) {
        setDraggingIndex(i);
        break;
      }
    }
  };
  
  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !onControlPointMove) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newPoint = screenToWorld({ x: mouseX, y: mouseY });
    onControlPointMove(draggingIndex, newPoint);
  };
  
  // Handle mouse up event
  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set line styles based on curve type
    let curveColor = "";
    let controlPointColor = "";
    
    switch (curveType) {
      case CurveType.Hermite:
        curveColor = "hsl(var(--hermite-color))";
        controlPointColor = "hsl(var(--hermite-color))";
        break;
      case CurveType.Bezier:
        curveColor = "hsl(var(--bezier-color))";
        controlPointColor = "hsl(var(--bezier-color))";
        break;
      case CurveType.BSpline:
        curveColor = "hsl(var(--bspline-color))";
        controlPointColor = "hsl(var(--bspline-color))";
        break;
    }
    
    // Draw control polygon
    if (drawPolygon && controlPoints.length > 1) {
      ctx.beginPath();
      const firstPoint = worldToScreen(controlPoints[0]);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < controlPoints.length; i++) {
        const point = worldToScreen(controlPoints[i]);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw curve
    if (curvePoints.length > 1) {
      ctx.beginPath();
      const firstPoint = worldToScreen(curvePoints[0]);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < curvePoints.length; i++) {
        const point = worldToScreen(curvePoints[i]);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw tangent vectors
    if (drawTangents && tangentPoints.length > 0) {
      for (let i = 0; i < tangentPoints.length; i += 2) {
        if (i + 1 < tangentPoints.length) {
          const start = worldToScreen(tangentPoints[i]);
          const end = worldToScreen(tangentPoints[i + 1]);
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          
          ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw arrow head
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const arrowSize = 10;
          
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowSize * Math.cos(angle - Math.PI / 6),
            end.y - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            end.x - arrowSize * Math.cos(angle + Math.PI / 6),
            end.y - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fill();
        }
      }
    }
    
    // Draw control points
    controlPoints.forEach((point, index) => {
      const screenPoint = worldToScreen(point);
      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = controlPointColor;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      
      // Draw point index
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(index.toString(), screenPoint.x, screenPoint.y);
    });
    
    // Draw highlight point if provided
    if (highlightPoint) {
      const screenPoint = worldToScreen(highlightPoint);
      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "yellow";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }
    
  }, [
    controlPoints,
    curvePoints,
    drawPolygon,
    drawTangents,
    scale,
    offset,
    tangentPoints,
    curveType,
    highlightPoint,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="border rounded"
      style={{ cursor: draggingIndex !== null ? "grabbing" : "default" }}
    />
  );
};

export default CurveCanvas;
