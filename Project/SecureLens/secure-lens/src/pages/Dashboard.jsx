import { useEffect, useState } from "react";

import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import VulnerabilityCard from "../components/VulnerabilityCard";
import VulnerabilityDetailDialog from "../components/VulnerabilityDetailDialog";
import {
  isRealFinding,
  normalizeSeverity,
} from "../services/falsePositiveService";
import {
  getAiResults,
  getFalsePositiveResults,
  getProject,
  getStaticResults,
  SECURE_LENS_STORAGE_EVENT,
} from "../services/storageService";
import {
  getVulnerabilityInfo,
} from "../services/vulnerabilityInfo";

const COLORS = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
};

function calculateScore({ highCount, mediumCount, lowCount }) {
  return Math.max(0, 100 - highCount * 20 - mediumCount * 10 - lowCount * 5);
}

function calculateGrade(score) {
  if (score < 40) return "F";
  if (score < 60) return "D";
  if (score < 80) return "C";
  if (score < 95) return "B";
  return "A";
}

export default function Dashboard() {
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);
  const [dashboardData, setDashboardData] = useState(() => ({
    aiResults: getAiResults(),
    reviewed: getFalsePositiveResults(),
    staticResults: getStaticResults(),
    project: getProject(),
  }));

  useEffect(() => {
    const refreshDashboard = () => {
      setDashboardData({
        aiResults: getAiResults(),
        reviewed: getFalsePositiveResults(),
        staticResults: getStaticResults(),
        project: getProject(),
      });
    };

    window.addEventListener(SECURE_LENS_STORAGE_EVENT, refreshDashboard);
    window.addEventListener("storage", refreshDashboard);
    window.addEventListener("focus", refreshDashboard);

    return () => {
      window.removeEventListener(SECURE_LENS_STORAGE_EVENT, refreshDashboard);
      window.removeEventListener("storage", refreshDashboard);
      window.removeEventListener("focus", refreshDashboard);
    };
  }, []);

  const { aiResults, reviewed, staticResults, project } = dashboardData;
  const reviewedRealResults = reviewed.filter(isRealFinding);
  const finalResults =
    reviewed.length > 0 ? reviewedRealResults : aiResults.length > 0 ? aiResults : staticResults;

  const highCount = finalResults.filter((item) => normalizeSeverity(item.severity) === "HIGH").length;
  const mediumCount = finalResults.filter((item) => normalizeSeverity(item.severity) === "MEDIUM").length;
  const lowCount = finalResults.filter((item) => normalizeSeverity(item.severity) === "LOW").length;
  const total = finalResults.length;
  const score = calculateScore({ highCount, mediumCount, lowCount });
  const grade = calculateGrade(score);

  const chartData = [
    { name: "HIGH", value: highCount },
    { name: "MEDIUM", value: mediumCount },
    { name: "LOW", value: lowCount },
  ].filter((item) => item.value > 0);

  const statCards = [
    ["Total Vulnerabilities", total],
    ["High Risk", highCount],
    ["Medium Risk", mediumCount],
    ["Security Score", score],
    ["Security Grade", grade],
  ];

  return (
    <Box sx={{ minWidth: 0 }}>
      <PageHeader
        title="Security Dashboard"
        subtitle="Review the current project's risk score, severity distribution, and final vulnerability list."
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
            {project?.name || "No Project"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
            <Chip label={project?.language || "Language Unknown"} />
            <Chip label={`Scanned Files ${project?.scannedFiles || 0}`} />
            <Chip label={`Duration ${project?.scanDuration || 0}s`} />
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map(([label, value]) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            valueVariant={label === "Security Grade" ? "h3" : "h4"}
          />
        ))}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Severity Distribution
          </Typography>
          <Box sx={{ height: 320 }}>
            {chartData.length === 0 ? (
              <Typography color="text.secondary">No vulnerabilities found.</Typography>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" outerRadius={110} label>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Vulnerability List
          </Typography>

          {finalResults.length === 0 ? (
            <Typography color="text.secondary">No analysis results yet.</Typography>
          ) : (
            finalResults.map((vuln, index) => {
              const info = getVulnerabilityInfo(vuln.type);

              return (
                <VulnerabilityCard
                  key={`${vuln.filePath}-${vuln.line}-${index}`}
                  vulnerability={vuln}
                  onClick={() => setSelectedVulnerability(vuln)}
                >
                  <Typography>CWE: {vuln.cwe || info.cwe}</Typography>
                  <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>{info.summary}</Typography>
                  {vuln.attackPath && (
                    <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>
                      Attack Path: {vuln.attackPath}
                    </Typography>
                  )}
                  <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>
                    Fix: {vuln.fix || info.fix.join(", ")}
                  </Typography>
                </VulnerabilityCard>
              );
            })
          )}
        </CardContent>
      </Card>

      <VulnerabilityDetailDialog
        vulnerability={selectedVulnerability}
        onClose={() => setSelectedVulnerability(null)}
      />
    </Box>
  );
}
