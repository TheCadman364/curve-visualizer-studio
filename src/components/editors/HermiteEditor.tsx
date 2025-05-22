
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurveType, HermiteForm, Point } from "@/types";
import CurveCanvas from "@/components/CurveCanvas";
import NumericInput from "@/components/controls/NumericInput";
import ToggleSwitch from "@/components/controls/ToggleSwitch";
import { evaluateHermite, generateHermiteCurvePoints, hermiteToPolynomial } from "@/utils/hermite";

interface HermiteEditorProps {
  width?: number;
  height?: number;
}

const HermiteEditor: React.FC<HermiteEditorProps> = ({
  width = 600,
  height = 400,
}) => {
  // Define the Hermite form state
  const [hermiteForm, setHermiteForm] = useState<HermiteForm>({
    P0: { x: 50, y: 200 },
    P1: { x: 550, y: 200 },
    T0: { x: 100, y: 0 },
    T1: { x: -100, y: 0 },
  });

  // UI options
  const [showControlPolygon, setShowControlPolygon] = useState(true);
  const [showTangents, setShowTangents] = useState(true);
  const [numPoints, setNumPoints] = useState(100);

  // Calculate derived values
  const [curvePoints, setCurvePoints] = useState<Point[]>([]);
  const [polynomial, setPolynomial] = useState<{ x: any; y: any }>({ x: {}, y: {} });
  const [tangentPoints, setTangentPoints] = useState<Point[]>([]);

  // Update curve points when Hermite form changes
  useEffect(() => {
    // Generate curve points
    const points = generateHermiteCurvePoints(hermiteForm, numPoints);
    setCurvePoints(points);
    
    // Calculate polynomial coefficients
    const poly = hermiteToPolynomial(hermiteForm);
    setPolynomial(poly);
    
    // Calculate tangent vectors
    const { P0, P1, T0, T1 } = hermiteForm;
    setTangentPoints([
      P0,
      { x: P0.x + T0.x, y: P0.y + T0.y },
      P1,
      { x: P1.x + T1.x, y: P1.y + T1.y },
    ]);
  }, [hermiteForm, numPoints]);

  // Update individual control points
  const updateP0 = (point: Point) => {
    setHermiteForm({ ...hermiteForm, P0: point });
  };

  const updateP1 = (point: Point) => {
    setHermiteForm({ ...hermiteForm, P1: point });
  };

  const updateT0 = (point: Point) => {
    setHermiteForm({ ...hermiteForm, T0: point });
  };

  const updateT1 = (point: Point) => {
    setHermiteForm({ ...hermiteForm, T1: point });
  };

  // Handle control point dragging on the canvas
  const handleControlPointMove = (index: number, point: Point) => {
    switch (index) {
      case 0:
        updateP0(point);
        break;
      case 1:
        updateP1(point);
        break;
      case 2:
        // For tangent control points, update the tangent vector
        // We need to convert the point position to a tangent vector
        const t0 = {
          x: point.x - hermiteForm.P0.x,
          y: point.y - hermiteForm.P0.y
        };
        updateT0(t0);
        break;
      case 3:
        // Same for T1
        const t1 = {
          x: point.x - hermiteForm.P1.x,
          y: point.y - hermiteForm.P1.y
        };
        updateT1(t1);
        break;
    }
  };

  // Create control points array for the canvas
  const canvasControlPoints: Point[] = [
    hermiteForm.P0,
    hermiteForm.P1,
    { x: hermiteForm.P0.x + hermiteForm.T0.x, y: hermiteForm.P0.y + hermiteForm.T0.y },
    { x: hermiteForm.P1.x + hermiteForm.T1.x, y: hermiteForm.P1.y + hermiteForm.T1.y }
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Hermite Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="canvas-container" style={{ width, height }}>
              <CurveCanvas
                controlPoints={canvasControlPoints}
                curvePoints={curvePoints}
                drawPolygon={showControlPolygon}
                drawTangents={showTangents}
                width={width}
                height={height}
                onControlPointMove={handleControlPointMove}
                tangentPoints={tangentPoints}
                curveType={CurveType.Hermite}
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
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="coefficients">Coefficients</TabsTrigger>
              </TabsList>
              
              <TabsContent value="points" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Start Point (P₀)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <NumericInput
                        id="p0x"
                        label="X"
                        value={hermiteForm.P0.x}
                        onChange={(value) => updateP0({ ...hermiteForm.P0, x: value })}
                      />
                      <NumericInput
                        id="p0y"
                        label="Y"
                        value={hermiteForm.P0.y}
                        onChange={(value) => updateP0({ ...hermiteForm.P0, y: value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">End Point (P₁)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <NumericInput
                        id="p1x"
                        label="X"
                        value={hermiteForm.P1.x}
                        onChange={(value) => updateP1({ ...hermiteForm.P1, x: value })}
                      />
                      <NumericInput
                        id="p1y"
                        label="Y"
                        value={hermiteForm.P1.y}
                        onChange={(value) => updateP1({ ...hermiteForm.P1, y: value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Start Tangent (T₀)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <NumericInput
                        id="t0x"
                        label="X"
                        value={hermiteForm.T0.x}
                        onChange={(value) => updateT0({ ...hermiteForm.T0, x: value })}
                      />
                      <NumericInput
                        id="t0y"
                        label="Y"
                        value={hermiteForm.T0.y}
                        onChange={(value) => updateT0({ ...hermiteForm.T0, y: value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">End Tangent (T₁)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <NumericInput
                        id="t1x"
                        label="X"
                        value={hermiteForm.T1.x}
                        onChange={(value) => updateT1({ ...hermiteForm.T1, x: value })}
                      />
                      <NumericInput
                        id="t1y"
                        label="Y"
                        value={hermiteForm.T1.y}
                        onChange={(value) => updateT1({ ...hermiteForm.T1, y: value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <ToggleSwitch
                    id="show-polygon"
                    label="Show Control Polygon"
                    checked={showControlPolygon}
                    onChange={setShowControlPolygon}
                  />
                  <ToggleSwitch
                    id="show-tangents"
                    label="Show Tangents"
                    checked={showTangents}
                    onChange={setShowTangents}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="coefficients">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Hermite Form</h3>
                    <table className="coefficient-table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>X</th>
                          <th>Y</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>P₀</td>
                          <td>{hermiteForm.P0.x.toFixed(2)}</td>
                          <td>{hermiteForm.P0.y.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>P₁</td>
                          <td>{hermiteForm.P1.x.toFixed(2)}</td>
                          <td>{hermiteForm.P1.y.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>T₀</td>
                          <td>{hermiteForm.T0.x.toFixed(2)}</td>
                          <td>{hermiteForm.T0.y.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>T₁</td>
                          <td>{hermiteForm.T1.x.toFixed(2)}</td>
                          <td>{hermiteForm.T1.y.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
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
                        <tr>
                          <td>u³</td>
                          <td>{polynomial.x.a?.toFixed(2) || 0}</td>
                          <td>{polynomial.y.a?.toFixed(2) || 0}</td>
                        </tr>
                        <tr>
                          <td>u²</td>
                          <td>{polynomial.x.b?.toFixed(2) || 0}</td>
                          <td>{polynomial.y.b?.toFixed(2) || 0}</td>
                        </tr>
                        <tr>
                          <td>u¹</td>
                          <td>{polynomial.x.c?.toFixed(2) || 0}</td>
                          <td>{polynomial.y.c?.toFixed(2) || 0}</td>
                        </tr>
                        <tr>
                          <td>u⁰</td>
                          <td>{polynomial.x.d?.toFixed(2) || 0}</td>
                          <td>{polynomial.y.d?.toFixed(2) || 0}</td>
                        </tr>
                      </tbody>
                    </table>
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

export default HermiteEditor;
