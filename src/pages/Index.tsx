
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HermiteEditor from "@/components/editors/HermiteEditor";
import BezierEditor from "@/components/editors/BezierEditor";
import BSplineEditor from "@/components/editors/BSplineEditor";

const Index = () => {
  // Responsive dimensions for canvas
  const [dimensions] = useState({
    width: Math.min(window.innerWidth * 0.9, 650),
    height: 400,
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          Interactive CAD Curve Editor
        </h1>
        <p className="text-center text-muted-foreground">
          Explore and experiment with Hermite, Bézier, and B-spline curves
        </p>
      </header>

      <main className="max-w-6xl mx-auto">
        <Tabs defaultValue="hermite" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hermite">Hermite Curves</TabsTrigger>
            <TabsTrigger value="bezier">Bézier Curves</TabsTrigger>
            <TabsTrigger value="bspline">B-Spline Curves</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="hermite">
              <HermiteEditor 
                width={dimensions.width} 
                height={dimensions.height} 
              />
            </TabsContent>
            
            <TabsContent value="bezier">
              <BezierEditor 
                width={dimensions.width} 
                height={dimensions.height} 
              />
            </TabsContent>
            
            <TabsContent value="bspline">
              <BSplineEditor 
                width={dimensions.width} 
                height={dimensions.height} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-sm text-muted-foreground">
        <p>Drag control points to modify the curves. Use the controls to adjust parameters.</p>
        <p className="mt-2">
          References: Farin's "Curves and Surfaces for CAGD" and Mortenson's "Geometric Modeling"
        </p>
      </footer>
    </div>
  );
};

export default Index;
