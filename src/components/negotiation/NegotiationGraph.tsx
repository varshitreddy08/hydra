"use client";

import { useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { NegotiationRound } from "@/types";

function PatientNode({ data }: { data: { label: string; score: number; level: string } }) {
  const levelColor =
    data.level === "P1_IMMEDIATE"
      ? "#ef4444"
      : data.level === "P2_EMERGENT"
      ? "#f59e0b"
      : "#3b82f6";

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 text-center min-w-[120px]"
      style={{
        background: `${levelColor}15`,
        borderColor: levelColor,
        boxShadow: `0 0 20px ${levelColor}40`,
      }}
    >
      <div className="text-xs font-bold mb-1" style={{ color: levelColor }}>
        {data.level.split("_")[0]}
      </div>
      <div className="text-white font-semibold text-sm">{data.label}</div>
      <div className="text-xs mt-1" style={{ color: levelColor }}>
        Score: {data.score.toFixed(1)}
      </div>
    </div>
  );
}

function AgentNode({
  data,
}: {
  data: { label: string; state: string; score?: number; won?: boolean };
}) {
  const borderColor = data.won
    ? "#10b981"
    : data.state === "BIDDING"
    ? "#a855f7"
    : data.state === "ALLOCATED"
    ? "#10b981"
    : "#1e2d4a";

  return (
    <div
      className="px-3 py-2 rounded-lg border text-center min-w-[100px] transition-all"
      style={{
        background: data.won ? "#10b98115" : "#111b2e",
        borderColor,
        boxShadow: data.won ? `0 0 12px #10b98140` : "none",
      }}
    >
      <div className="text-xs text-slate-400 mb-0.5">{data.state}</div>
      <div className="text-white text-xs font-medium">{data.label}</div>
      {data.score !== undefined && (
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: data.won ? "#10b981" : "#94a3b8" }}
        >
          {data.score.toFixed(1)}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { patient: PatientNode, agent: AgentNode };

function buildGraph(round: NegotiationRound | null) {
  if (!round) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Patient node at center
  nodes.push({
    id: "patient",
    type: "patient",
    position: { x: 300, y: 200 },
    data: {
      label: round.patientId.slice(0, 8) + "…",
      score: 0,
      level: "P2_EMERGENT",
    },
  });

  // Agent nodes in a circle
  const totalBids = round.bids.length;
  const radius = 220;

  round.bids.forEach((bid, i) => {
    const angle = (i / Math.max(totalBids, 1)) * 2 * Math.PI - Math.PI / 2;
    const x = 300 + radius * Math.cos(angle);
    const y = 200 + radius * Math.sin(angle);
    const won = bid.accepted === true;

    nodes.push({
      id: bid.agentId,
      type: "agent",
      position: { x, y },
      data: {
        label: bid.agentId.slice(0, 8) + "…",
        state: won ? "ALLOCATED" : bid.accepted === false ? "BID_REJECTED" : "BIDDING",
        score: bid.score,
        won,
      },
    });

    edges.push({
      id: `edge-${bid.agentId}`,
      source: bid.agentId,
      target: "patient",
      label: bid.score.toFixed(1),
      style: {
        stroke: won ? "#10b981" : bid.accepted === false ? "#374151" : "#a855f7",
        strokeWidth: won ? 2 : 1,
        strokeDasharray: won ? "none" : "4 2",
      },
      markerEnd: won
        ? { type: MarkerType.ArrowClosed, color: "#10b981" }
        : undefined,
      animated: bid.accepted === null,
      labelStyle: { fill: "#94a3b8", fontSize: 10 },
      labelBgStyle: { fill: "#111b2e" },
    });
  });

  return { nodes, edges };
}

export function NegotiationGraph() {
  const { activeRound, rounds, resources, patients } = useSimulationStore();
  const displayRound = activeRound ?? rounds[0] ?? null;

  // Build resource name lookup: agentId → resource name
  const agentToName = Object.fromEntries(
    resources.map((r) => {
      // agents have id = "agent-<resourceId>"
      return [`agent-${r.id}`, r.name];
    })
  );

  // Patient MRN lookup
  const patientMrn = displayRound
    ? (patients.find((p) => p.id === displayRound.patientId)?.mrn ?? displayRound.patientId.slice(0, 8))
    : "";

  const { nodes: initialNodes, edges: initialEdges } = buildGraph(displayRound);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph(displayRound);
    // Patch in real names
    const patched = newNodes.map((n) => {
      if (n.id === "patient") {
        return { ...n, data: { ...n.data, label: patientMrn || n.data.label } };
      }
      const name = agentToName[n.id];
      if (name) return { ...n, data: { ...n.data, label: name } };
      return n;
    });
    setNodes(patched);
    setEdges(newEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRound, setNodes, setEdges]);

  if (!displayRound) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600 text-sm">
        <div className="text-center">
          <div className="text-4xl mb-3">⚡</div>
          <p>Waiting for first negotiation round…</p>
          <p className="text-xs mt-1 text-slate-700">Start the simulation to see the agent network</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      colorMode="dark"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2d4a" />
      <Controls />
      <MiniMap
        nodeColor={(n) =>
          n.type === "patient" ? "#ef4444" : n.data?.won ? "#10b981" : "#1e2d4a"
        }
        style={{ background: "#0d1526" }}
      />
    </ReactFlow>
  );
}
