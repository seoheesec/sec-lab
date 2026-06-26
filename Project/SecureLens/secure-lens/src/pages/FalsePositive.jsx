import { useState } from "react";

import { Box, Button, Chip, Typography } from "@mui/material";

import PageHeader from "../components/PageHeader";
import VulnerabilityCard from "../components/VulnerabilityCard";
import VulnerabilityDetailDialog from "../components/VulnerabilityDetailDialog";
import {
  isRealFinding,
  runFalsePositiveReview,
} from "../services/falsePositiveService";
import { updateLatestScanFromFindings } from "../services/scanHistoryService";
import {
  getAiResults,
  getFalsePositiveFeedback,
  getFalsePositiveResults,
  getProject,
  saveAiResults,
  saveFalsePositiveResults,
} from "../services/storageService";

export default function FalsePositive() {
  const [results, setResults] = useState(() => getFalsePositiveResults());
  const [feedbackCount, setFeedbackCount] = useState(() => getFalsePositiveFeedback().length);
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);

  const handleReview = () => {
    const aiResults = getAiResults();
    const reviewed = runFalsePositiveReview(aiResults);
    const realOnly = reviewed.filter(isRealFinding);
    const falsePositiveCount = reviewed.length - realOnly.length;
    const project = getProject();

    setResults(reviewed);
    setFeedbackCount(getFalsePositiveFeedback().length);
    saveFalsePositiveResults(reviewed);
    saveAiResults(aiResults);
    updateLatestScanFromFindings({
      fileName: project?.name,
      vulnerabilities: realOnly,
      falsePositiveCount,
    });
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
      <Chip
        label={`User feedback ${feedbackCount}`}
        sx={{ ml: 1 }}
      />

      {results.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          Run this after AI analysis to classify real findings and likely false positives.
        </Typography>
      ) : (
        results.map((item, index) => (
          <VulnerabilityCard
            key={`${item.filePath}-${item.line}-${index}`}
            vulnerability={item}
            chipLabel={item.status}
            chipColor={item.status === "REAL" ? "error" : "default"}
            onClick={() => setSelectedVulnerability(item)}
            sx={{ mt: 2 }}
          >
            <Typography>Severity: {item.severity}</Typography>
            {item.falseReason && (
              <Typography sx={{ overflowWrap: "anywhere" }}>{item.falseReason}</Typography>
            )}
          </VulnerabilityCard>
        ))
      )}

      <VulnerabilityDetailDialog
        vulnerability={selectedVulnerability}
        onClose={() => {
          setFeedbackCount(getFalsePositiveFeedback().length);
          setSelectedVulnerability(null);
        }}
      />
    </Box>
  );
}
