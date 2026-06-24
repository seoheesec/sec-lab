import { useState } from "react";

import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

import { runFalsePositiveReview } from "../services/falsePositiveService";
import {
  getAiResults,
  saveAiResults,
  saveFalsePositiveResults,
} from "../services/storageService";

export default function FalsePositive() {
  const [results, setResults] = useState([]);

  const handleReview = () => {
    const aiResults = getAiResults();
    const reviewed = runFalsePositiveReview(aiResults);
    const realOnly = reviewed.filter((item) => item.status === "REAL");

    setResults(reviewed);
    saveFalsePositiveResults(reviewed);
    saveAiResults(realOnly);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        False Positive Review
      </Typography>

      <Button variant="contained" onClick={handleReview}>
        Start Review
      </Button>

      {results.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          AI 분석 결과를 기준으로 오탐 여부를 검토합니다.
        </Typography>
      ) : (
        results.map((item, index) => (
          <Card key={`${item.filePath}-${item.line}-${index}`} sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6">{item.type}</Typography>
                <Chip
                  color={item.status === "REAL" ? "error" : "default"}
                  label={item.status}
                />
              </Box>
              <Typography color="text.secondary">
                {item.filePath}:{item.line}
              </Typography>
              <Typography>Severity: {item.severity}</Typography>
              {item.falseReason && <Typography>{item.falseReason}</Typography>}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
