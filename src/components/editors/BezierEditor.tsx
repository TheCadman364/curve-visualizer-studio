
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurveType, Point, TrimRange } from "@/types";
import CurveCanvas from "@/components/CurveCanvas";
import NumericInput from "@/components/controls/NumericInput";
import ToggleSwitch from "@/components/controls/ToggleSwitch";
import Slider from "@/components/controls/Slider";
import {
  deCasteljau,
  evaluateBezier,
  generateBezierCurvePoints,
  getTrimmedControlPoints,
  bezierToPolynomial,
  bezierDerivative,
  calculateIntersectionControlPoints,
} from "@/utils/bezier";

interface BezierEditorProps {
  width?: number;
  height?: number;
}

const BezierEditor: React.FC<BezierEditorProps> = ({
  width = 600,
  height = 400,
}) => {
  // State for Bezier degree and control points
  const [degree, setDegree] = useState<2 | 3>(3);
  const [controlPoints, setControlPoints] = useState<Point[]>([
    { x: 100, y: 250 },
    { x: 200, y: 100 },
    { x: 400, y: 100 },
    { x: 500, y: 250 },
  ]);
  
  // Derived state - curve points, trim points
  const [curvePoints, setCurvePoints] = useState<Point[]>([]);
  const [trimmedCurvePoints, setTrimmedCurvePoints] = useState<Point[]>([]);
  const [trimmedControlPoints, setTrimmedControlPoints] = useState<Point[]>([]);
  
  // UI options
  const [showControlPolygon, setShowControlPolygon] = useState(true);
  const [showTangents, setShowTangents] = useState(false);
  const [closed, setClosed] = useState(false);
  const [trimRange, setTrimRange] = useState<TrimRange>({ u1: 0.25, u2: 0.75 });
  const [useTrimming, setUseTrimming] = useState(false);
  const [useIntersection, setUseIntersection] = useState(false);
  const [tangentAtU, setTangentAtU] = useState(0.5);
  
  // Calculate polynomial coefficients
  const [polynomialCoeffs, setPolynomialCoeffs] = useState<{x: number[], y: number[]}>({ x: [], y: [] });
  
  // For intersection-based recovery
  const [intersectionPoint, setIntersectionPoint] = useState<Point | null>(null);
  const [starPoints, setStarPoints] = useState<Point[]>([]);
  
  // Tangent vector at u
  const [tangentVector, setTangentVector] = useState<Point[]>([]);
  
  // Effect for updating control points when degree changes
  useEffect(() => {
    let newPoints: Point[];
    
    if (degree === 2 && controlPoints.length === 4) {
      // Convert cubic to quadratic
      newPoints = [
        controlPoints[0],
        controlPoints[1],
        controlPoints[3],
      ];
    } else if (degree === 3 && controlPoints.length === 3) {
      // Convert quadratic to cubic
      const p0 = controlPoints[0];
      const p1 = controlPoints[1];
      const p2 = controlPoints[2];
      
      // Insert an additional point by subdivision
      newPoints = [
        p0,
        { x: (2*p1.x + p0.x)/3, y: (2*p1.y + p0.y)/3 },
        { x: (2*p1.x + p2.x)/3, y: (2*p1.y + p2.y)/3 },
        p2,
      ];
    } else {
      newPoints = [...controlPoints];
    }
    
    setControlPoints(newPoints);
  }, [degree]);
  
  // Effect for updating curve points when control points or options change
  useEffect(() => {
    // Handle closed curve if needed
    let effectiveControlPoints = [...controlPoints];
    
    if (closed) {
      // For closed curve, repeat first point at the end
      effectiveControlPoints = [...controlPoints, controlPoints[0]];
      
      // For C1 continuity, reflect first handle
      if (effectiveControlPoints.length >= 4) {
        // When P0 and Pn are the same point, P1 and Pn-1 must be reflections of each other
        const p0 = effectiveControlPoints[0];
        const p1 = effectiveControlPoints[1];
        
        // Calculate the reflection of p1 through p0
        const reflectedP1 = {
          x: 2 * p0.x - p1.x,
          y: 2 * p0.y - p1.y,
        };
        
        // Replace the last handle with the reflection
        effectiveControlPoints[effectiveControlPoints.length - 2] = reflectedP1;
      }
    }
    
    // Calculate intersection point for P* if needed
    if (useIntersection && degree === 3) {
      // Only applicable to cubic Bezier
      const p0 = controlPoints[0];
      const p3 = controlPoints[3];
      
      // Use the midpoint as P* for simplicity
      const pStar = {
        x: (p0.x + p3.x) / 2,
        y: (p0.y + p3.y) / 2
      };
      
      // Calculate P1 and P2 using the intersection formulas
      const [p1, p2] = calculateIntersectionControlPoints(p0, pStar, p3);
      
      setStarPoints([p0, p1, p2, p3]);
      setIntersectionPoint(pStar);
      
      // Use these new control points for the curve
      effectiveControlPoints = [p0, p1, p2, p3];
    } else {
      setStarPoints([]);
      setIntersectionPoint(null);
    }
    
    // Generate the main curve
    const points = generateBezierCurvePoints(effectiveControlPoints, 100);
    setCurvePoints(points);
    
    // Calculate polynomial coefficients
    if (degree === 2 || degree === 3) {
      const coeffs = bezierToPolynomial(effectiveControlPoints.slice(0, degree + 1));
      setPolynomialCoeffs(coeffs);
    }
    
    // Calculate trimmed curve if needed
    if (useTrimming) {
      const trimmed = getTrimmedControlPoints(effectiveControlPoints, trimRange);
      setTrimmedControlPoints(trimmed);
      
      const trimmedPoints = generateBezierCurvePoints(trimmed, 100);
      setTrimmedCurvePoints(trimmedPoints);
    } else {
      setTrimmedControlPoints([]);
      setTrimmedCurvePoints([]);
    }
    
    // Calculate tangent vector at point u
    const pointAtU = evaluateBezier(effectiveControlPoints, tangentAtU);
    const tangent = bezierDerivative(effectiveControlPoints, tangentAtU);
    
    // Scale the tangent vector for display
    const tangentScale = 30;
    setTangentVector([
      pointAtU,
      {
        x: pointAtU.x + tangent.x * tangentScale,
        y: pointAtU.y + tangent.y * tangentScale
      }
    ]);
    
  }, [controlPoints, degree, closed, trimRange, useTrimming, useIntersection, tangentAtU]);
  
  // Handle control point movement
  const handleControlPointMove = (index: number, point: Point) => {
    const newPoints = [...controlPoints];
    newPoints[index] = point;
    setControlPoints(newPoints);
  };
  
  // Handle trim range change
  const handleTrimRangeChange = (value: number[]) => {
    setTrimRange({ u1: value[0], u2: value[1] });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bézier Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="canvas-container" style={{ width, height }}>
              <CurveCanvas
                controlPoints={controlPoints}
                curvePoints={useTrimming ? trimmedCurvePoints : curvePoints}
                drawPolygon={showControlPolygon}
                drawTangents={showTangents}
                width={width}
                height={height}
                onControlPointMove={handleControlPointMove}
                tangentPoints={showTangents ? tangentVector : []}
                curveType={CurveType.Bezier}
                highlightPoint={intersectionPoint}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="points">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="coefficients">Coefficients</TabsTrigger>
              </TabsList>
              
              <TabsContent value="points" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Control Points</h3>
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
              </TabsContent>
              
              <TabsContent value="options" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Curve Options</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <ToggleSwitch
                      id="cubic-bezier"
                      label={`Degree: ${degree === 3 ? 'Cubic' : 'Quadratic'}`}
                      checked={degree === 3}
                      onChange={(checked) => setDegree(checked ? 3 : 2)}
                    />
                    <ToggleSwitch
                      id="closed-curve"
                      label="Closed Curve"
                      checked={closed}
                      onChange={setClosed}
                    />
                    <ToggleSwitch
                      id="show-polygon"
                      label="Show Control Polygon"
                      checked={showControlPolygon}
                      onChange={setShowControlPolygon}
                    />
                    <ToggleSwitch
                      id="show-tangent"
                      label="Show Tangent"
                      checked={showTangents}
                      onChange={setShowTangents}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tangent Position</h3>
                  <Slider
                    id="tangent-u"
                    label="Parameter u"
                    value={[tangentAtU]}
                    onChange={(value) => setTangentAtU(value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Trimming</h3>
                    <ToggleSwitch
                      id="use-trimming"
                      label="Enable"
                      checked={useTrimming}
                      onChange={setUseTrimming}
                    />
                  </div>
                  
                  <Slider
                    id="trim-range"
                    label="Trim Range"
                    value={[trimRange.u1, trimRange.u2]}
                    onChange={handleTrimRangeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={!useTrimming}
                  />
                </div>
                
                {degree === 3 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Intersection Recovery</h3>
                      <ToggleSwitch
                        id="use-intersection"
                        label="Enable"
                        checked={useIntersection}
                        onChange={setUseIntersection}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uses P* (intersection point) to compute P1 and P2
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="coefficients" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Polynomial Coefficients</h3>
                  <table className="coefficient-table">
                    <thead>
                      <tr>
                        <th>Term</th>
                        <th>X Coefficient</th>
                        <th>Y Coefficient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {degree === 3 && (
                        <tr>
                          <td>u³</td>
                          <td>{polynomialCoeffs.x[0]?.toFixed(2) || 0}</td>
                          <td>{polynomialCoeffs.y[0]?.toFixed(2) || 0}</td>
                        </tr>
                      )}
                      <tr>
                        <td>u{degree === 3 ? '²' : '²'}</td>
                        <td>{polynomialCoeffs.x[degree === 3 ? 1 : 0]?.toFixed(2) || 0}</td>
                        <td>{polynomialCoeffs.y[degree === 3 ? 1 : 0]?.toFixed(2) || 0}</td>
                      </tr>
                      <tr>
                        <td>u¹</td>
                        <td>{polynomialCoeffs.x[degree === 3 ? 2 : 1]?.toFixed(2) || 0}</td>
                        <td>{polynomialCoeffs.y[degree === 3 ? 2 : 1]?.toFixed(2) || 0}</td>
                      </tr>
                      <tr>
                        <td>u⁰</td>
                        <td>{polynomialCoeffs.x[degree === 3 ? 3 : 2]?.toFixed(2) || 0}</td>
                        <td>{polynomialCoeffs.y[degree === 3 ? 3 : 2]?.toFixed(2) || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {useIntersection && intersectionPoint && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Intersection Point (P*)</h3>
                    <table className="coefficient-table">
                      <thead>
                        <tr>
                          <th>Point</th>
                          <th>X</th>
                          <th>Y</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>P*</td>
                          <td>{intersectionPoint.x.toFixed(2)}</td>
                          <td>{intersectionPoint.y.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                {useTrimming && trimmedControlPoints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Trimmed Control Points</h3>
                    <table className="coefficient-table">
                      <thead>
                        <tr>
                          <th>Point</th>
                          <th>X</th>
                          <th>Y</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trimmedControlPoints.map((point, index) => (
                          <tr key={index}>
                            <td>P{index}</td>
                            <td>{point.x.toFixed(2)}</td>
                            <td>{point.y.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BezierEditor;
