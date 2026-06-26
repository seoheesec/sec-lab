import { useEffect, useState } from "react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import PageHeader from "../components/PageHeader";
import VulnerabilityCard from "../components/VulnerabilityCard";
import VulnerabilityDetailDialog from "../components/VulnerabilityDetailDialog";
import {
  isFalsePositiveFinding,
  isRealFinding,
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

function loadReportData() {
  return {
    project: getProject(),
    aiResults: getAiResults(),
    staticResults: getStaticResults(),
    reviewed: getFalsePositiveResults(),
  };
}

export default function Report() {
  const [reportData, setReportData] = useState(loadReportData);
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);

  useEffect(() => {
    const refresh = () => setReportData(loadReportData());

    window.addEventListener(SECURE_LENS_STORAGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(SECURE_LENS_STORAGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const { project, aiResults, staticResults, reviewed } = reportData;
  const reviewedRealResults = reviewed.filter(isRealFinding);
  const finalResults =
    reviewed.length > 0 ? reviewedRealResults : aiResults.length > 0 ? aiResults : staticResults;
  const falsePositiveCount = reviewed.filter(isFalsePositiveFinding).length;

  const generatePDF = async () => {
    const report = document.getElementById("report");
    const canvas = await html2canvas(report, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("SecureLens_Report.pdf");
  };

  return (
    <Box>
      <PageHeader
        title="Security Report"
        subtitle="Generate a shareable summary of the latest SecureLens analysis results."
      />

      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={generatePDF}
        sx={{ mb: 3 }}
      >
        Download PDF
      </Button>

      <Card id="report">
        <CardContent>
          <Typography variant="h5" mb={3}>
            SecureLens Report
          </Typography>

          <Typography variant="h6" mb={1}>
            Project Summary
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            <Chip label={project?.name || "No Project"} />
            <Chip label={project?.language || "Language Unknown"} />
            <Chip label={`Scanned Files ${project?.scannedFiles || 0}`} />
            <Chip label={`Final Issues ${finalResults.length}`} />
            <Chip label={`False Positives ${falsePositiveCount}`} />
          </Box>

          <Typography mb={4}>
            This project was analyzed using client-side static rules, AI-based
            path review, and false-positive filtering. Backend-only capabilities
            are represented with local browser storage and API integration.
          </Typography>

          <Typography variant="h6" mb={2}>
            Vulnerability Results
          </Typography>

          {finalResults.length === 0 ? (
            <Typography color="text.secondary">No vulnerabilities found.</Typography>
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
                  <Typography sx={{ overflowWrap: "anywhere" }}>Summary: {info.summary}</Typography>
                  <Typography sx={{ overflowWrap: "anywhere" }}>
                    Attack Path: {vuln.attackPath || info.scenario}
                  </Typography>
                  <Typography sx={{ overflowWrap: "anywhere" }}>
                    Fix: {vuln.fix || info.fix.join(", ")}
                  </Typography>
                </VulnerabilityCard>
              );
            })
          )}

          <Typography variant="h6" mt={4} mb={2}>
            Final Assessment
          </Typography>
          <Typography>
            The project contains {finalResults.length} final security issues.
            HIGH severity vulnerabilities should be reviewed first, followed by
            exploitable MEDIUM findings and secret-management issues.
          </Typography>
        </CardContent>
      </Card>

      <VulnerabilityDetailDialog
        vulnerability={selectedVulnerability}
        onClose={() => setSelectedVulnerability(null)}
      />
    </Box>
  );
}
