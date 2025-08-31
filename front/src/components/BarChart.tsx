import React, { useEffect, useRef } from "react";
import type { VendasData } from "../types";
import * as d3 from "d3";


interface BarChartProps {
  data: VendasData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 90 };

    svg.attr("width", width).attr("height", height);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.vendas) || 0])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.produto))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    svg
      .append("g")
      .attr("fill", "#2196f3")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", x(0))
      .attr("y", (d) => y(d.produto)!)
      .attr("width", (d) => x(d.vendas) - x(0))
      .attr("height", y.bandwidth());

    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80));
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;
