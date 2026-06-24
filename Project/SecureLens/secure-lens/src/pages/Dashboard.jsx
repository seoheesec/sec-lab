import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import PageHeader from "../components/PageHeader";
import { getAiResults, getProject, getStaticResults } from "../services/storageService";
import { getVulnerabilityInfo } from "../services/vulnerabilityInfo";

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
  const aiResults = getAiResults();
  const staticResults = getStaticResults();
  const project = getProject();
  const finalResults = aiResults.length > 0 ? aiResults : staticResults;

  const highCount = finalResults.filter((item) => item.severity === "HIGH").length;
  const mediumCount = finalResults.filter((item) => item.severity === "MEDIUM").length;
  const lowCount = finalResults.filter((item) => item.severity === "LOW").length;
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
          <Card key={label} sx={{ minWidth: 0 }}>
            <CardContent>
              <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {label}
              </Typography>
              <Typography variant={label === "Security Grade" ? "h3" : "h4"} fontWeight="bold">
                {value}
              </Typography>
            </CardContent>
          </Card>
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
                <Card key={`${vuln.filePath}-${vuln.line}-${index}`} sx={{ p: 2, mb: 2, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ overflowWrap: "anywhere" }}>
                      {vuln.type}
                    </Typography>
                    <Chip label={vuln.severity} color={vuln.severity === "HIGH" ? "error" : "default"} />
                  </Box>
                  <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {vuln.filePath}:{vuln.line}
                  </Typography>
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
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
