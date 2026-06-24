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

import { runAIAnalysis } from "../services/aiAnalysisService";
import { getStaticResults, saveAiResults } from "../services/storageService";

export default function AIAnalysis() {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    const staticResults = getStaticResults();

    if (staticResults.length === 0) {
      setMessage("먼저 정적 분석을 실행하세요.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const aiResults = await runAIAnalysis("", staticResults);

      setResults(aiResults);
      saveAiResults(aiResults);
      setMessage(`${aiResults.length}개 항목의 AI 분석이 완료되었습니다.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        AI Analysis
      </Typography>

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
            <Typography color="text.secondary">AI 분석 결과가 없습니다.</Typography>
          ) : (
            results.map((item, index) => (
              <Card key={`${item.filePath}-${item.line}-${index}`} sx={{ p: 2, mb: 2 }}>
                <Typography fontWeight="bold">{item.type}</Typography>
                <Typography color="text.secondary">
                  {item.filePath}:{item.line}
                </Typography>
                <Typography>Exploitable: {item.isExploitable ? "YES" : "NO"}</Typography>
                <Typography>Severity: {item.severity}</Typography>
                <Typography>Attack Path: {item.attackPath}</Typography>
                <Typography>Reason: {item.reason}</Typography>
                <Typography>Fix: {item.fix}</Typography>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
