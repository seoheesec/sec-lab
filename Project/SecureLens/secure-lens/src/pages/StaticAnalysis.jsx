import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";

import BugReportIcon from "@mui/icons-material/BugReport";

import PageHeader from "../components/PageHeader";
import {
  demoPythonVulnerableCode,
  demoVulnerableCode,
} from "../data/demoVulnerableCode";
import { analyzeFiles, runStaticAnalysis } from "../services/analysisService";
import { saveProject, saveStaticResults } from "../services/storageService";

export default function StaticAnalysis() {
  const [projectName, setProjectName] = useState("Manual Scan");
  const [targetLanguage, setTargetLanguage] = useState("JavaScript");
  const [code, setCode] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const saveAnalysis = ({ vulnerabilities, scannedFiles, scanDuration, language }) => {
    setResults(vulnerabilities);
    saveStaticResults(vulnerabilities);
    saveProject({
      name: projectName,
      language,
      scannedFiles,
      scanDuration,
      analyzedAt: new Date().toISOString(),
    });
  };

  const handleAnalyze = () => {
    const startedAt = performance.now();
    const vulnerabilities = runStaticAnalysis(code).map((item) => ({
      ...item,
      filePath: `${projectName}.${targetLanguage.toLowerCase()}`,
      fileName: projectName,
    }));
    const scanDuration = Number(((performance.now() - startedAt) / 1000).toFixed(2));

    saveAnalysis({
      vulnerabilities,
      scannedFiles: 1,
      scanDuration,
      language: targetLanguage,
    });
    setMessage(`${vulnerabilities.length} findings detected.`);
  };

  const loadDemoCode = () => {
    setProjectName("Demo Vulnerable App");
    setTargetLanguage("JavaScript");
    setCode(demoVulnerableCode);
    setResults([]);
    setMessage("Demo vulnerable code loaded. Click Analyze Code to scan it.");
  };

  const loadPythonDemoCode = () => {
    setProjectName("Demo Python Vulnerable App");
    setTargetLanguage("Python");
    setCode(demoPythonVulnerableCode);
    setResults([]);
    setMessage("Demo Python vulnerable code loaded. Click Analyze Code to scan it.");
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    const files = await Promise.all(
      selectedFiles.map(async (file) => ({
        name: file.name,
        path: file.name,
        content: await file.text(),
      })),
    );
    const result = analyzeFiles(files);

    saveAnalysis({
      vulnerabilities: result.vulnerabilities,
      scannedFiles: result.scannedFiles,
      scanDuration: result.scanDuration,
      language: "Uploaded Files",
    });
    setMessage(`${result.scannedFiles} files scanned. ${result.vulnerabilities.length} findings detected.`);
  };

  return (
    <Box>
      <PageHeader
        title="Static Analysis"
        subtitle="Paste source code, upload files, or load the demo sample to detect common vulnerability patterns."
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 220px" },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              label="Project Name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <TextField
              label="Target Language"
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
            />
          </Box>

          <TextField
            label="Source Code"
            multiline
            minRows={12}
            fullWidth
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />

          <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
            <Button variant="contained" onClick={handleAnalyze} disabled={!code.trim()}>
              Analyze Code
            </Button>
            <Button variant="outlined" startIcon={<BugReportIcon />} onClick={loadDemoCode}>
              Load JS Demo
            </Button>
            <Button variant="outlined" startIcon={<BugReportIcon />} onClick={loadPythonDemoCode}>
              Load Python Demo
            </Button>
            <Button variant="outlined" component="label">
              Upload Files
              <input hidden multiple type="file" onChange={handleFileUpload} />
            </Button>
          </Box>

          {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Detection Results
          </Typography>

          {results.length === 0 ? (
            <Typography color="text.secondary">No analysis results yet.</Typography>
          ) : (
            results.map((item, index) => (
              <Card key={`${item.filePath}-${item.line}-${index}`} sx={{ p: 2, mb: 2, minWidth: 0 }}>
                <Typography fontWeight="bold" sx={{ overflowWrap: "anywhere" }}>
                  {item.type}
                </Typography>
                <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {item.filePath}:{item.line}
                </Typography>
                <Typography>Severity: {item.severity}</Typography>
                <Typography>CWE: {item.cwe}</Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>{item.description}</Typography>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
