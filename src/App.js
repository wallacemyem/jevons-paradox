import React, { useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { toPng, toJpeg } from "html-to-image";
// import './index.css';

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, annotationPlugin);

function App() {
  const [costs, setCosts] = useState([
    { label: "Regular car", cost: 4, miles: 250 },
    { label: "Hybrid car", cost: 2, miles: 400 }
  ]);
  const chartRef = useRef(null);

  const handleChange = (idx, field, value) => {
    const updated = [...costs];
    updated[idx][field] = field === "label" ? value : Number(value);
    setCosts(updated);
  };

  // Dynamically fit a curve through the two points using a power-law: cost = a * miles^b
  // Solve for a and b so that (m1, c1) and (m2, c2) are on the curve
  const [p1, p2] = costs;
  let a = 1, b = -0.5; // defaults
  if (p1.miles > 0 && p2.miles > 0 && p1.miles !== p2.miles) {
    const logm1 = Math.log(p1.miles);
    const logm2 = Math.log(p2.miles);
    const logc1 = Math.log(p1.cost);
    const logc2 = Math.log(p2.cost);
    b = (logc2 - logc1) / (logm2 - logm1);
    a = p1.cost / Math.pow(p1.miles, b);
  }

  // Set curve range to match user input
  const minMiles = Math.min(p1.miles, p2.miles);
  const maxMiles = Math.max(p1.miles, p2.miles);
  const minCost = 0;
  const maxCost = Math.max(p1.cost, p2.cost);

  const curveMiles = [];
  const curveCosts = [];
  for (let m = minMiles; m <= maxMiles; m += 5) {
    const c = a * Math.pow(m, b);
    curveMiles.push(m);
    curveCosts.push(c);
  }

  // console everything for debugging
  console.log("Costs:", costs);
//   console.log("Curve:", curveMiles, curveCosts);
//   console.log("a:", a, "b:", b);
  console.log("minMiles:", minMiles, "maxMiles:", maxMiles);
  console.log("minCost:", minCost, "maxCost:", maxCost);

  // Memoize chartData and chartOptions so they update when costs change
  const chartData = React.useMemo(() => ({
    labels: curveMiles,
    datasets: [
      {
        label: "Cost Curve",
        data: curveCosts,
        fill: false,
        borderColor: "rgba(16,185,129,0.8)",
        borderWidth: 4,
        pointRadius: 0,
        tension: 0.4
      }
    ]
  }), [curveMiles, curveCosts]);

  const chartOptions = React.useMemo(() => ({
    responsive: false,
    plugins: {
      legend: { display: false },
      annotation: {
        annotations: {
          line1: {
            type: "line",
            xMin: costs[0].miles,
            xMax: costs[0].miles,
            yMin: 0,
            yMax: costs[0].cost,
            borderColor: "#0ea5e9", 
            borderWidth: 5,         
            borderDash: [8, 8]
          },
          line2: {
            type: "line",
            xMin: minMiles,
            xMax: costs[0].miles,
            yMin: costs[0].cost,
            yMax: costs[0].cost,
            borderColor: "#0ea5e9",
            borderWidth: 5,
            borderDash: [8, 8]
          },
          line3: {
            type: "line",
            xMin: costs[1].miles,
            xMax: costs[1].miles,
            yMin: 0,
            yMax: costs[1].cost,
            borderColor: "#0ea5e9",
            borderWidth: 5,
            borderDash: [8, 8]
          },
          line4: {
            type: "line",
            xMin: costs[0].cost,
            xMax: costs[1].miles,
            yMin: costs[1].cost,
            yMax: costs[1].cost,
            borderColor: "#0ea5e9",
            borderWidth: 5,
            borderDash: [8, 8]
          },
          labelArrow: {
            type: "label",
            xValue: (costs[0].miles + costs[1].miles) / 2,
            yValue: Math.min(costs[0].cost, costs[1].cost) - 0.5,
            content: [`${costs[1].miles - costs[0].miles} miles more`],
            color: "#0f172a",
            font: { size: 16, weight: "bold" },
            backgroundColor: "rgba(236, 253, 245, 0.9)",
            borderRadius: 6,
            padding: 8
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "# of Miles Driven (miles/week)", color: "#0f172a", font: { size: 16, weight: "bold" } },
        min: minMiles,
        max: maxMiles,
        ticks: { stepSize: 50, color: "#334155", font: { size: 14 } }
      },
      y: {
        title: { display: true, text: "Cost of Driving 25 miles", color: "#0f172a", font: { size: 16, weight: "bold" } },
        min: minCost,
        max: maxCost,
        ticks: {
          callback: (v) => `$${v}`,
          color: "#334155",
          font: { size: 14 }
        }
      }
    }
  }), [costs, minMiles, maxMiles, minCost, maxCost]);

  const downloadImage = (type) => {
    if (!chartRef.current) return;
    const fn = type === "jpeg" ? toJpeg : toPng;
    fn(chartRef.current, { quality: 0.95 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `jevons-paradox.${type}`;
        link.href = dataUrl;
        link.click();
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center py-10">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-emerald-700 mb-2 text-center">Jevons Paradox</h2>
        <p className="text-lg text-gray-600 mb-8 text-center">Hybrid Car Example</p>
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
          {costs.map((point, idx) => (
            <div key={idx} className="flex flex-col bg-emerald-50 rounded-lg p-4 shadow-sm">
              <label className="text-sm font-semibold text-emerald-700 mb-1">
                Label
                <input
                  type="text"
                  value={point.label}
                  onChange={e => handleChange(idx, "label", e.target.value)}
                  className="block w-full mt-1 px-2 py-1 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </label>
              <label className="text-sm font-semibold text-emerald-700 mb-1 mt-2">
                Cost ($)
                <input
                  type="number"
                  value={point.cost}
                  onChange={e => handleChange(idx, "cost", e.target.value)}
                  className="block w-full mt-1 px-2 py-1 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </label>
              <label className="text-sm font-semibold text-emerald-700 mt-2">
                Miles
                <input
                  type="number"
                  value={point.miles}
                  onChange={e => handleChange(idx, "miles", e.target.value)}
                  className="block w-full mt-1 px-2 py-1 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </label>
            </div>
          ))}
        </div>
        <div ref={chartRef} className="flex justify-center items-center bg-white rounded-lg shadow-md p-4 mb-8" style={{ width: 600, height: 400 }}>
          <Line data={chartData} options={chartOptions} width={600} height={400} />
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => downloadImage("png")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded shadow transition"
          >
            Download as PNG
          </button>
          <button
            onClick={() => downloadImage("jpeg")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded shadow transition"
          >
            Download as JPEG
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;