
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurveType, KnotVector, Point } from "@/types";
import CurveCanvas from "@/components/CurveCanvas";
import NumericInput from "@/components/controls/NumericInput";
import ToggleSwitch from "@/components/controls/ToggleSwitch";
import Slider from "@/components/controls/Slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateBasisFunctions,
  coxDeBoor,
  evaluateBSpline,
  generateBSplineCurvePoints,
  generateUniformKnots,
  bsplineDerivative,
  validateKnots,
} from "@/utils/bspline";

interface BSplineEditorProps {
  width?: number;
  height?: number;
}

const BSplineEditor: React.FC<BSplineEditorProps> = ({
  width = 600,
  height = 400,
}) => {
  // State for B-spline control points and parameters
  const [controlPoints, setControlPoints] = useState<Point[]>([
    { x: 100, y: 200 },
    { x: 200, y: 100 },
    { x: 300, y: 150 },
    { x: 400, y: 100 },
    { x: 500, y: 200 },
  ]);
  const [degree, setDegree] = useState(3);
  const [knots, setKnots] = useState<KnotVector>([]);
  const [knotInput, setKnotInput] = useState("");
  const [curvePoints, setCurvePoints] = useState<Point[]>([]);
  const [basisValues, setBasisValues] = useState<number[][]>([]);
  
  // UI state
  const [showControlPolygon, setShowControlPolygon] = useState(true);
  const [showTangent, setShowTangent] = useState(true);
  const [tangentParameter, setTangentParameter] = useState(0.5);
  const [tangentVector, setTangentVector] = useState<Point[]>([]);
  const [numPoints, setNumPoints] = useState(100);
  
  // Initialize knots
  useEffect(() => {
    const n = controlPoints.length;
    const k = Math.min(degree, n - 1);
    
    // Generate uniform knots
    const uniformKnots = generateUniformKnots(n, k);
    setKnots(uniformKnots);
    setKnotInput(uniformKnots.join(", "));
  }, [controlPoints.length, degree]);
  
  // Update curve points when control points or knots change
  useEffect(() => {
    if (!validateKnots(knots, controlPoints.length, degree)) {
      console.error("Invalid knot vector");
      return;
    }
    
    // Generate curve points
    const points = generateBSplineCurvePoints(
      controlPoints,
      degree,
      knots,
      numPoints
    );
    setCurvePoints(points);
    
    // Calculate basis functions for visualization
    const basis = calculateBasisFunctions(
      controlPoints.length,
      degree,
      knots,
      numPoints
    );
    setBasisValues(basis);
    
    // Calculate tangent vector at parameter
    const paramRange = knots[degree] + tangentParameter * (knots[knots.length - degree - 1] - knots[degree]);
    const pointAtParam = evaluateBSpline(controlPoints, degree, paramRange, knots);
    const tangent = bsplineDerivative(controlPoints, degree, paramRange, knots);
    
    // Scale the tangent vector for display
    const scale = 30;
    setTangentVector([
      pointAtParam,
      {
        x: pointAtParam.x + tangent.x * scale,
        y: pointAtParam.y + tangent.y * scale
      }
    ]);
  }, [controlPoints, degree, knots, tangentParameter, numPoints]);
  
  // Handle control point dragging
  const handleControlPointMove = (index: number, point: Point) => {
    const newPoints = [...controlPoints];
    newPoints[index] = point;
    setControlPoints(newPoints);
  };
  
  // Handle adding a new control point
  const handleAddPoint = () => {
    // Add a new point near the last point
    const lastPoint = controlPoints[controlPoints.length - 1];
    const newPoint = { x: lastPoint.x + 50, y: lastPoint.y };
    setControlPoints([...controlPoints, newPoint]);
  };
  
  // Handle removing the last control point
  const handleRemovePoint = () => {
    if (controlPoints.length > 2) {
      setControlPoints(controlPoints.slice(0, -1));
    }
  };
  
  // Handle updating the knots from input
  const handleKnotInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKnotInput(e.target.value);
  };
  
  // Parse and validate knot input
  const handleUpdateKnots = () => {
    try {
      const newKnots = knotInput.split(',').map(k => parseFloat(k.trim()));
      
      if (validateKnots(newKnots, controlPoints.length, degree)) {
        setKnots(newKnots);
      } else {
        console.error("Invalid knot vector. Must be non-decreasing and have length n+k+1.");
        // Reset to uniform knots
        const uniformKnots = generateUniformKnots(controlPoints.length, degree);
        setKnots(uniformKnots);
        setKnotInput(uniformKnots.join(", "));
      }
    } catch (error) {
      console.error("Error parsing knots:", error);
    }
  };
  
  // Draw the basis functions
  const renderBasisFunctions = () => {
    if (!basisValues.length) return null;
    
    const svgWidth = width;
    const svgHeight = 100;
    const colors = [
      "#f44336", "#2196f3", "#4caf50", "#ff9800", "#9c27b0",
      "#795548", "#607d8b", "#e91e63", "#009688", "#cddc39"
    ];
    
    return (
      <svg width={svgWidth} height={svgHeight} className="blending-function-plot">
        {/* Draw horizontal axis */}
        <line
          x1={0}
          y1={svgHeight - 10}
          x2={svgWidth}
          y2={svgHeight - 10}
          stroke="black"
          strokeWidth={1}
        />
        
        {/* Draw basis function curves */}
        {basisValues.map((values, i) => {
          if (i >= colors.length) return null;
          
          const points = values.map((v, j) => ({
            x: (j / values.length) * svgWidth,
            y: svgHeight - 10 - v * (svgHeight - 20)
          }));
          
          const pathData = points.map((p, j) => (
            j === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
          )).join(" ");
          
          return (
            <path
              key={i}
              d={pathData}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              fill="none"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">B-Spline Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="canvas-container" style={{ width, height }}>
              <CurveCanvas
                controlPoints={controlPoints}
                curvePoints={curvePoints}
                drawPolygon={showControlPolygon}
                drawTangents={showTangent}
                width={width}
                height={height}
                onControlPointMove={handleControlPointMove}
                tangentPoints={showTangent ? tangentVector : []}
                curveType={CurveType.BSpline}
              />
            </div>
            {renderBasisFunctions()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="points">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="points">Points & Degree</TabsTrigger>
                <TabsTrigger value="knots">Knot Vector</TabsTrigger>
              </TabsList>
              
              <TabsContent value="points" className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Control Points</h3>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={handleAddPoint}>
                      Add Point
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemovePoint}
                      disabled={controlPoints.length <= 2}
                    >
                      Remove Point
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {controlPoints.map((point, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <NumericInput
                        id={`p${index}x`}
                        label={`P${index} X`}
                        value={point.x}
                        onChange={(value) => {
                          const newPoints = [...controlPoints];
                          newPoints[index] = { ...point, x: value };
                          setControlPoints(newPoints);
                        }}
                      />
                      <NumericInput
                        id={`p${index}y`}
                        label={`P${index} Y`}
                        value={point.y}
                        onChange={(value) => {
                          const newPoints = [...controlPoints];
                          newPoints[index] = { ...point, y: value };
                          setControlPoints(newPoints);
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium">Degree</h3>
                  <Slider
                    id="degree"
                    label={`Degree: ${degree}`}
                    value={[degree]}
                    onChange={(value) => setDegree(Math.min(value[0], controlPoints.length - 1))}
                    min={1}
                    max={Math.min(5, controlPoints.length - 1)}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tangent Position</h3>
                  <Slider
                    id="tangent-u"
                    label="Parameter u"
                    value={[tangentParameter]}
                    onChange={(value) => setTangentParameter(value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <ToggleSwitch
                    id="show-polygon"
                    label="Show Control Polygon"
                    checked={showControlPolygon}
                    onChange={setShowControlPolygon}
                  />
                  <ToggleSwitch
                    id="show-tangent"
                    label="Show Tangent"
                    checked={showTangent}
                    onChange={setShowTangent}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="knots" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Knot Vector</h3>
                  <p className="text-xs text-muted-foreground">
                    Enter comma-separated values. Must be non-decreasing and have length n+k+1 = {controlPoints.length + degree + 1}.
                  </p>
                  <div className="flex space-x-2">
                    <Input
                      value={knotInput}
                      onChange={handleKnotInputChange}
                      placeholder="0, 0, 0, 0, 1, 1, 1, 1"
                    />
                    <Button onClick={handleUpdateKnots}>Update</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Current Knots</h3>
                  <div className="bg-gray-50 p-2 rounded text-sm font-mono overflow-x-auto">
                    [{knots.map(k => k.toFixed(2)).join(", ")}]
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Length: {knots.length}, Required: {controlPoints.length + degree + 1}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Parameter Range</h3>
                  <p className="text-sm">
                    Domain: [{knots[degree]?.toFixed(2) || 0}, {knots[knots.length - degree - 1]?.toFixed(2) || 1}]
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Knot Presets</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const uniformKnots = generateUniformKnots(controlPoints.length, degree);
                        setKnots(uniformKnots);
                        setKnotInput(uniformKnots.join(", "));
                      }}
                    >
                      Uniform
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Open uniform knots (clamped B-spline)
                        const n = controlPoints.length;
                        const k = degree;
                        const openKnots: number[] = [];
                        
                        // k+1 zeros at start
                        for (let i = 0; i <= k; i++) {
                          openKnots.push(0);
                        }
                        
                        // Middle knots
                        for (let i = 1; i < n - k; i++) {
                          openKnots.push(i / (n - k));
                        }
                        
                        // k+1 ones at end
                        for (let i = 0; i <= k; i++) {
                          openKnots.push(1);
                        }
                        
                        setKnots(openKnots);
                        setKnotInput(openKnots.join(", "));
                      }}
                    >
                      Clamped
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BSplineEditor;
