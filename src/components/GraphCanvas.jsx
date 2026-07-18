import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { Card } from './Ui/Card';
import { Button } from './Ui/Button';

export function GraphCanvas({
  elements = [],
  layoutName = 'cose',
  nodeColor = '#c084fc',
  nodeShape = 'ellipse',
  edgeColor = '#94a3b8',
  edgeType = 'bezier',
  directed = true,
  showLabels = true,
  onNodeSelect,
  simulationState = null,
  className = '',
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);

  // Cytoscape initialization and updates
  useEffect(() => {
    if (!containerRef.current || elements.length === 0) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: JSON.parse(JSON.stringify(elements)), // Deep copy to avoid mutating props
        style: [
          {
            selector: 'node',
            style: {
              'background-color': nodeColor,
              'label': showLabels ? 'data(label)' : '',
              'shape': nodeShape,
              'width': '35px',
              'height': '35px',
              'color': '#0f172a',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'font-size': '12px',
              'font-weight': '600',
              'border-width': '2px',
              'border-color': '#ffffff',
              'transition-property': 'background-color, border-color, border-width, opacity',
              'transition-duration': '0.2s',
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': edgeColor,
              'target-arrow-color': edgeColor,
              'target-arrow-shape': directed ? 'triangle' : 'none',
              'label': 'data(weightLabel)',
              'font-size': '10px',
              'font-weight': '700',
              'color': '#1e293b',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.96,
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'text-rotation': 'autorotate',
              'curve-style': edgeType,
              'opacity': 0.7,
              'arrow-scale': 1.1,
              'transition-property': 'line-color, target-arrow-color, width, opacity',
              'transition-duration': '0.2s',
            },
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': '3px',
              'border-color': '#eab308',
              'background-color': '#eab308',
            },
          },
          {
            selector: 'edge:selected',
            style: {
              'line-color': '#eab308',
              'target-arrow-color': '#eab308',
              'width': 4,
            },
          },
          {
            selector: '.highlighted',
            style: {
              'background-color': '#10b981',
              'line-color': '#10b981',
              'target-arrow-color': '#10b981',
              'border-color': '#ffffff',
              'opacity': 1.0,
            },
          },
          {
            selector: '.neighbor',
            style: {
              'background-color': '#3b82f6',
              'border-color': '#ffffff',
              'opacity': 1.0,
            },
          },
          {
            selector: '.faded',
            style: {
              'opacity': 0.25,
            },
          },
          {
            selector: '.sim-visited',
            style: {
              'background-color': '#38bdf8',
              'border-color': '#ffffff',
              'opacity': 1,
            },
          },
          {
            selector: '.sim-traversed',
            style: {
              'line-color': '#38bdf8',
              'target-arrow-color': '#38bdf8',
              'width': 4,
              'opacity': 1,
            },
          },
          {
            selector: '.sim-frontier',
            style: {
              'background-color': '#f59e0b',
              'border-color': '#ffffff',
              'opacity': 1,
            },
          },
          {
            selector: '.sim-current',
            style: {
              'background-color': '#f43f5e',
              'line-color': '#f43f5e',
              'target-arrow-color': '#f43f5e',
              'border-color': '#ffffff',
              'border-width': '4px',
              'opacity': 1,
            },
          },
        ],
        layout: {
          name: layoutName,
          animate: elements.length < 100,
          animationDuration: 400,
          fit: true,
          padding: 50,
          nodeRepulsion: () => 4500,
          idealEdgeLength: () => 50,
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
      });

      cyRef.current = cy;

      // Event: tap node
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        const nodeId = node.id();
        const outgoers = node.outgoers('edge');
        const incomers = node.incomers('edge');
        const neighbors = node.neighborhood('node');

        const nodeData = {
          id: nodeId,
          outDegree: outgoers.length,
          inDegree: incomers.length,
          neighbors: neighbors.map(n => n.id()),
        };

        setSelectedNodeInfo(nodeData);
        if (onNodeSelect) {
          onNodeSelect(nodeId, nodeData);
        }

        // Visual highlights
        cy.elements().addClass('faded').removeClass('highlighted').removeClass('neighbor');
        node.removeClass('faded').addClass('highlighted');
        
        // Highlight outgoing neighbors in blue, and self-incoming in light blue
        neighbors.forEach(neigh => {
          neigh.removeClass('faded').addClass('neighbor');
        });
        
        // Highlight connected edges
        node.connectedEdges().forEach(edge => {
          edge.removeClass('faded');
          if (edge.source().id() === nodeId) {
            edge.addClass('highlighted');
          } else {
            edge.addClass('neighbor');
          }
        });
      });

      // Event: tap background
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          cy.elements().removeClass('faded').removeClass('highlighted').removeClass('neighbor');
          setSelectedNodeInfo(null);
          if (onNodeSelect) {
            onNodeSelect(null, null);
          }
        }
      });

      return () => {
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }
      };
    } catch (err) {
      console.error("Cytoscape render error: ", err);
    }
  }, [elements, layoutName, nodeColor, nodeShape, edgeColor, edgeType, directed, showLabels, onNodeSelect]);

  useEffect(() => {
    if (!cyRef.current) {
      return;
    }

    const cy = cyRef.current;
    cy.elements().removeClass('sim-visited sim-traversed sim-frontier sim-current');

    if (!simulationState) {
      return;
    }

    simulationState.visited?.forEach((nodeId) => {
      cy.getElementById(nodeId).addClass('sim-visited');
    });

    simulationState.frontier?.forEach((nodeId) => {
      if (nodeId !== simulationState.node) {
      cy.getElementById(nodeId).addClass('sim-frontier');
      }
    });

    simulationState.traversedEdges?.forEach((edgeId) => {
      cy.getElementById(edgeId).addClass('sim-traversed');
    });

    if (simulationState.via) {
      cy.getElementById(simulationState.via).addClass('sim-current');
    }

    cy.getElementById(simulationState.node).removeClass('sim-visited').addClass('sim-current');
  }, [simulationState]);

  // Controls helper functions
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.2);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.animate({
        fit: {
          padding: 50
        },
        duration: 300
      });
    }
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      const layout = cyRef.current.layout({
        name: layoutName,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50
      });
      layout.run();
    }
  };

  const handleExportPNG = () => {
    if (cyRef.current) {
      const options = {
        bg: '#ffffff',
        full: true,
        scale: 2
      };
      const png64 = cyRef.current.png(options);
      
      const downloadLink = document.createElement("a");
      downloadLink.href = png64;
      downloadLink.download = "graph.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Card className={`p-0 overflow-hidden relative flex flex-col min-h-0 ${className}`} contentClassName="flex-1 min-h-0">
      <div className="flex h-full min-h-[420px] flex-col">
        <div className="relative flex-1 min-h-[420px] lg:min-h-0 bg-white text-slate-900">
          {elements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center select-none font-sans">
              <div className="mb-4 h-14 w-14 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 font-heading">No Graph Data</h3>
              <p className="max-w-xs text-xs leading-relaxed">Input a valid adjacency list on the left to visualize the graph.</p>
            </div>
          ) : (
            <div ref={containerRef} className="outline-none w-full h-full" />
          )}

          {elements.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none z-10 select-none">
              <div className="flex gap-1.5 pointer-events-auto">
                <Button size="sm" variant="secondary" onClick={handleZoomIn} title="Zoom In" className="bg-white shadow-sm dark:bg-slate-900">+</Button>
                <Button size="sm" variant="secondary" onClick={handleZoomOut} title="Zoom Out" className="bg-white shadow-sm dark:bg-slate-900">-</Button>
                <Button size="sm" variant="secondary" onClick={handleFit} title="Fit Screen" className="bg-white shadow-sm dark:bg-slate-900">Fit</Button>
                <Button size="sm" variant="secondary" onClick={handleResetLayout} title="Recalculate Layout" className="bg-white shadow-sm dark:bg-slate-900">Reset</Button>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleExportPNG} 
                title="Export PNG" 
                className="bg-white shadow-sm pointer-events-auto text-xs dark:bg-slate-900"
              >
                Export PNG
              </Button>
            </div>
          )}
        </div>

        {selectedNodeInfo && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white p-4 animate-[slideUp_0.25s_ease-out] w-full select-none dark:bg-slate-900">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-heading">
                Node Details: <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-medium ml-1.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">{selectedNodeInfo.id}</span>
              </h4>
              <Button size="sm" variant="outline" onClick={() => {
                if (cyRef.current) {
                  cyRef.current.elements().removeClass('faded').removeClass('highlighted').removeClass('neighbor');
                }
                setSelectedNodeInfo(null);
              }} className="py-0.5 px-2 text-xs">Close</Button>
            </div>
            <div className="grid grid-cols-2 gap-3 font-sans">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">In-degree:</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{selectedNodeInfo.inDegree}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Out-degree:</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{selectedNodeInfo.outDegree}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Neighbors:</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                  {selectedNodeInfo.neighbors.length > 0 
                    ? selectedNodeInfo.neighbors.join(', ') 
                    : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
