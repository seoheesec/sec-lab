import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import {
  getAiResults,
  getFalsePositiveResults,
  getProject,
  getStaticResults,
} from "../services/storageService";
import { getVulnerabilityInfo } from "../services/vulnerabilityInfo";

export default function Report() {
  const project = getProject();
  const aiResults = getAiResults();
  const staticResults = getStaticResults();
  const reviewed = getFalsePositiveResults();
  const finalResults = aiResults.length > 0 ? aiResults : staticResults;
  const falsePositiveCount = reviewed.filter(
    (item) => item.status === "FALSE_POSITIVE",
  ).length;

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
          <Typography variant="h4" mb={3}>
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
                <Card key={`${vuln.filePath}-${vuln.line}-${index}`} sx={{ p: 2, mb: 2 }}>
                  <Typography fontWeight="bold">{vuln.type}</Typography>
                  <Typography color="text.secondary">
                    {vuln.filePath}:{vuln.line}
                  </Typography>
                  <Typography>Severity: {vuln.severity}</Typography>
                  <Typography>CWE: {vuln.cwe || info.cwe}</Typography>
                  <Typography>Summary: {info.summary}</Typography>
                  <Typography>Attack Path: {vuln.attackPath || info.scenario}</Typography>
                  <Typography>Fix: {vuln.fix || info.fix.join(", ")}</Typography>
                </Card>
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
    </Box>
  );
}
