import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Typography,
} from "@mui/material";

import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import PageHeader from "../components/PageHeader";
import VulnerabilityCard from "../components/VulnerabilityCard";
import VulnerabilityDetailDialog from "../components/VulnerabilityDetailDialog";
import { runAIAnalysis } from "../services/aiAnalysisService";
import { getStaticResults, saveAiResults } from "../services/storageService";

export default function AIAnalysis() {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);

  const handleAnalyze = async () => {
    const staticResults = getStaticResults();

    if (staticResults.length === 0) {
      setMessage("Run static analysis before AI analysis.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const aiResults = await runAIAnalysis("", staticResults);

      setResults(aiResults);
      saveAiResults(aiResults);
      setMessage(`${aiResults.length} findings reviewed by AI.`);
    } catch {
      setMessage("AI 분석 중 오류가 발생했습니다. 정적 분석 결과를 다시 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="AI Analysis"
        subtitle="Review static findings with AI-assisted reasoning to estimate exploitability and remediation paths."
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={handleAnalyze}
            disabled={loading}
          >
            Run AI Analysis
          </Button>

          {loading && <LinearProgress sx={{ mt: 2 }} />}
          {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            AI Path Analysis Result
          </Typography>

          {results.length === 0 ? (
            <Typography color="text.secondary">No AI analysis results yet.</Typography>
          ) : (
            results.map((item, index) => (
              <VulnerabilityCard
                key={`${item.filePath}-${item.line}-${index}`}
                vulnerability={item}
                onClick={() => setSelectedVulnerability(item)}
              >
                <Typography>Exploitable: {item.isExploitable ? "YES" : "NO"}</Typography>
                <Typography>Severity: {item.severity}</Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>Attack Path: {item.attackPath}</Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>Reason: {item.reason}</Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>Fix: {item.fix}</Typography>
              </VulnerabilityCard>
            ))
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
