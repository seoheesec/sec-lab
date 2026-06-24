import { useState } from "react";

import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

import PageHeader from "../components/PageHeader";
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
      <PageHeader
        title="False Positive Review"
        subtitle="Filter AI-reviewed findings so the final dashboard and report focus on actionable vulnerabilities."
      />

      <Button variant="contained" onClick={handleReview}>
        Start Review
      </Button>

      {results.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          Run this after AI analysis to classify real findings and likely false positives.
        </Typography>
      ) : (
        results.map((item, index) => (
          <Card key={`${item.filePath}-${item.line}-${index}`} sx={{ mt: 2, minWidth: 0 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
                  {item.type}
                </Typography>
                <Chip
                  color={item.status === "REAL" ? "error" : "default"}
                  label={item.status}
                />
              </Box>
              <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {item.filePath}:{item.line}
              </Typography>
              <Typography>Severity: {item.severity}</Typography>
              {item.falseReason && (
                <Typography sx={{ overflowWrap: "anywhere" }}>{item.falseReason}</Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
