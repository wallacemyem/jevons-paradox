import React, { useState, useRef, useEffect } from 'react';

const App = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  const [regularCarCost, setRegularCarCost] = useState(4);
  const [hybridCarCost, setHybridCarCost] = useState(2);
  const [originalMiles, setOriginalMiles] = useState(250);
  const [newMiles, setNewMiles] = useState(400);
  const [milesSegment, setMilesSegment] = useState(25);

  
  const width = 800;
  const height = 600;
  const padding = 120;

  
  const regularCarColor = "#3B82F6"; 
  const hybridCarColor = "#10B981"; 

  
  const maxCost = Math.max(regularCarCost, hybridCarCost) * 1.5;
  const maxMiles = Math.max(originalMiles, newMiles) * 1.2;

  
  const scaleX = (x) => (x / maxMiles) * (width - padding * 2) + padding;
  const scaleY = (y) => height - ((y / maxCost) * (height - padding * 2) + padding);

  
  const generateCurvePoints = (cost, targetMiles) => {
    const points = [];
    
    const constant = cost * targetMiles;
    
    for (let miles = 50; miles <= maxMiles * 1.1; miles += 10) {
      
      const y = constant / miles;
      points.push({ x: miles, y });
    }
    
    
    const exactPoint = { x: targetMiles, y: cost };
    
    
    let insertIndex = points.findIndex(p => p.x > targetMiles);
    if (insertIndex === -1) insertIndex = points.length;
    
    
    const filteredPoints = points.filter(p => 
      Math.abs(p.x - targetMiles) > 5 || p.x === targetMiles
    );
    
    
    filteredPoints.splice(insertIndex, 0, exactPoint);
    
    return filteredPoints;
  };

  const regularCarPoints = generateCurvePoints(regularCarCost, originalMiles);
  const hybridCarPoints = generateCurvePoints(hybridCarCost, newMiles);

  
  const createPath = (points) => {
    return points
      .map((point, i) =>
        (i === 0 ? 'M ' : 'L ') + scaleX(point.x) + ' ' + scaleY(point.y)
      )
      .join(' ');
  };

  const regularCarPath = createPath(regularCarPoints);
  const hybridCarPath = createPath(hybridCarPoints);

  
  const downloadSVG = () => {
    if (!svgRef.current) return;

    
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);

    
    const titleElement = `<title>Jevons Paradox - Hybrid Car</title>`;
    const svgWithTitle = svgData.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" ${titleElement}`);

    const svgBlob = new Blob([svgWithTitle], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `jevons-paradox-${originalMiles}-${newMiles}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    
    URL.revokeObjectURL(svgUrl);
  };

  
  const downloadPNG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);

    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    
    const scale = 2; 
    canvas.width = width * scale;
    canvas.height = height * scale;

    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      
      ctx.scale(scale, scale);

      
      ctx.drawImage(img, 0, 0);

      
      let pngUrl;
      try {
        pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `jevons-paradox-${originalMiles}-${newMiles}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (e) {
        console.error("Error converting to PNG:", e);
        alert("Could not convert to PNG. Trying JPEG instead...");

        
        try {
          pngUrl = canvas.toDataURL('image/jpeg', 0.95);
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `jevons-paradox-${originalMiles}-${newMiles}.jpg`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (e2) {
          console.error("Error converting to JPEG:", e2);
          alert("Could not convert to image format. Please try SVG download instead.");
        }
      }

      
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 p-6 rounded-lg shadow-md max-w-4xl mx-auto" ref={containerRef}>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Jevons Paradox: Hybrid Car</h2>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={downloadSVG}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm"
        >
          Download as SVG
        </button>
        <button
          onClick={downloadPNG}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm"
        >
          Download as PNG/JPEG
        </button>
      </div>

      <div className="mb-6 w-full bg-white p-4 rounded-md shadow-sm">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-4 justify-center mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-700">Regular Car Cost ($ per {milesSegment} miles)</label>
            <input
              type="number"
              value={regularCarCost}
              onChange={(e) => setRegularCarCost(Number(e.target.value))}
              min="0.5"
              step="0.5"
              className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-700">Hybrid Car Cost ($ per {milesSegment} miles)</label>
            <input
              type="number"
              value={hybridCarCost}
              onChange={(e) => setHybridCarCost(Number(e.target.value))}
              min="0.5"
              step="0.5"
              className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-700">Miles Segment</label>
            <input
              type="number"
              value={milesSegment}
              onChange={(e) => setMilesSegment(Number(e.target.value))}
              min="1"
              className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-700">Original Miles per Week</label>
            <input
              type="number"
              value={originalMiles}
              onChange={(e) => setOriginalMiles(Number(e.target.value))}
              min="50"
              step="10"
              className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-700">New Miles per Week</label>
            <input
              type="number"
              value={newMiles}
              onChange={(e) => setNewMiles(Number(e.target.value))}
              min="50"
              step="10"
              className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-md shadow-sm mb-6">
        <svg ref={svgRef} width={width} height={height} className="border border-gray-200 rounded-md justify-center">
          {}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="black"
            strokeWidth="2"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="black"
            strokeWidth="2"
          />

          {}
          <text
            x={width / 2}
            y={height - padding / 3}  
            textAnchor="middle"
            className="text-sm font-medium"  
          >
            # of Miles Driven (miles/week)
          </text>

          <text
            x={padding / 8}  
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${padding / 9}, ${height / 2})`}  
            className="text-sm font-medium"  
          >
            Cost of Driving {milesSegment} miles
          </text>

          {}
          <path 
            d={regularCarPath} 
            stroke={regularCarColor} 
            strokeWidth="2" 
            fill="none" 
          />

          {}
          <path 
            d={hybridCarPath} 
            stroke={hybridCarColor} 
            strokeWidth="2" 
            fill="none" 
          />

          {}
          <line
            x1={scaleX(originalMiles)}
            y1={padding}
            x2={scaleX(originalMiles)}
            y2={height - padding}
            stroke="black"
            strokeWidth="1"
            strokeDasharray="4"
          />

          <line
            x1={scaleX(newMiles)}
            y1={padding}
            x2={scaleX(newMiles)}
            y2={height - padding}
            stroke="black"
            strokeWidth="1"
            strokeDasharray="4"
          />

          {}
          <line
            x1={padding}
            y1={scaleY(regularCarCost)}
            x2={scaleX(originalMiles)}
            y2={scaleY(regularCarCost)}
            stroke="black"
            strokeWidth="1"
            strokeDasharray="4"
          />

          <line
            x1={padding}
            y1={scaleY(hybridCarCost)}
            x2={scaleX(newMiles)}
            y2={scaleY(hybridCarCost)}
            stroke="black"
            strokeWidth="1"
            strokeDasharray="4"
          />

          {}
          <circle 
            cx={scaleX(originalMiles)} 
            cy={scaleY(regularCarCost)} 
            r="4" 
            fill={regularCarColor} 
          />
          
          <circle 
            cx={scaleX(newMiles)} 
            cy={scaleY(hybridCarCost)} 
            r="4" 
            fill={hybridCarColor} 
          />

          {}
          <line
            x1={scaleX(originalMiles) + 10}
            y1={height - padding + 25}
            x2={scaleX(newMiles) - 10}
            y2={height - padding + 25}
            stroke="black"
            strokeWidth="1"
          />
          <polygon
            points={`${scaleX(newMiles) - 10},${height - padding + 20} ${scaleX(newMiles) - 10},${height - padding + 30} ${scaleX(newMiles)},${height - padding + 25}`}
            fill="black"
          />
          <text
            x={(scaleX(originalMiles) + scaleX(newMiles)) / 2}
            y={height - padding + 40}
            textAnchor="middle"
            className="text-xs"
          >
            {newMiles - originalMiles} miles more
          </text>

          {}
          <text
            x={scaleX(originalMiles)}
            y={height - padding + 15}
            textAnchor="middle"
            className="text-xs"
          >
            {originalMiles}
          </text>
          <text
            x={scaleX(newMiles)}
            y={height - padding + 15}
            textAnchor="middle"
            className="text-xs"
          >
            {newMiles}
          </text>
          <text
            x={padding - 10}
            y={scaleY(regularCarCost)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs"
          >
            ${regularCarCost}
          </text>
          <text
            x={padding - 10}
            y={scaleY(hybridCarCost)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs"
          >
            ${hybridCarCost}
          </text>

          {}
          <text
            x={scaleX(originalMiles)}
            y={height - 5}
            textAnchor="middle"
            className="text-xs"
          >
            (original driving habit)
          </text>
          <text
            x={scaleX(newMiles)}
            y={height - 5}
            textAnchor="middle"
            className="text-xs"
          >
            (new driving habit)
          </text>

          {}
          <text
            x={padding - 15}
            y={scaleY(regularCarCost) + 15}
            textAnchor="end"
            className="text-xs"
          >
            (regular car)
          </text>
          <text
            x={padding - 15}
            y={scaleY(hybridCarCost) + 15}
            textAnchor="end"
            className="text-xs"
          >
            (hybrid car)
          </text>
        </svg>

        <div className="mt-6 bg-white p-6 rounded-md shadow-sm w-full">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Summary</h3>
          <p className="text-gray-700 mb-2">
            With a regular car costing <span className="font-semibold">${regularCarCost}</span> per {milesSegment} miles, a person drives <span className="font-semibold">{originalMiles}</span> miles weekly.
            After switching to a hybrid car costing <span className="font-semibold">${hybridCarCost}</span> per {milesSegment} miles, they drive <span className="font-semibold">{newMiles}</span> miles weekly,
            an increase of <span className="font-semibold">{newMiles - originalMiles}</span> miles (<span className="font-semibold">{((newMiles - originalMiles) / originalMiles * 100).toFixed(1)}%</span>).
          </p>

          <div className="flex flex-col md:flex-row justify-between mt-4">
            <div className="bg-blue-50 p-3 rounded-md mb-4 md:mb-0 md:mr-4 flex-1">
              <h4 className="font-medium text-blue-800">Regular Car Weekly Cost</h4>
              <p className="text-2xl font-bold text-blue-600">${(regularCarCost * originalMiles / milesSegment).toFixed(2)}</p>
            </div>

            <div className="bg-green-50 p-3 rounded-md flex-1">
              <h4 className="font-medium text-green-800">Hybrid Car Weekly Cost</h4>
              <p className="text-2xl font-bold text-green-600">${(hybridCarCost * newMiles / milesSegment).toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-md border-l-4 border-yellow-400 bg-yellow-50">
            <p className="text-gray-800">
              {hybridCarCost * newMiles / milesSegment < regularCarCost * originalMiles / milesSegment
                ? <span>Despite driving more miles, there's still a net saving of <span className="font-semibold text-green-600">${(regularCarCost * originalMiles / milesSegment - hybridCarCost * newMiles / milesSegment).toFixed(2)}</span> per week.</span>
                : hybridCarCost * newMiles / milesSegment > regularCarCost * originalMiles / milesSegment
                  ? <span>The increased driving has actually increased total spending by <span className="font-semibold text-red-600">${(hybridCarCost * newMiles / milesSegment - regularCarCost * originalMiles / milesSegment).toFixed(2)}</span> per week.</span>
                  : <span>The increased driving has exactly offset the efficiency gains, resulting in the same total spending.</span>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
