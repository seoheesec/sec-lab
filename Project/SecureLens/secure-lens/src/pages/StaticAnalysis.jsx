import { useRef, useState } from "react";

import Editor from "@monaco-editor/react";

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
import VulnerabilityCard from "../components/VulnerabilityCard";
import VulnerabilityDetailDialog from "../components/VulnerabilityDetailDialog";
import {
  demoPythonVulnerableCode,
  demoVulnerableCode,
} from "../data/demoVulnerableCode";
import {
  analyzeFiles,
  detectLanguageFromPath,
  runStaticAnalysis,
} from "../services/analysisService";
import { saveScanFromFindings } from "../services/scanHistoryService";
import {
  saveAiResults,
  saveFalsePositiveResults,
  saveProject,
  saveStaticResults,
} from "../services/storageService";

const EDITOR_LANGUAGE = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  PHP: "php",
  Java: "java",
  C: "c",
  "C++": "cpp",
};

function getEditorLanguage(language) {
  return EDITOR_LANGUAGE[language] || "plaintext";
}

function buildUploadedCodePreview(files) {
  if (files.length === 1) {
    return files[0].content;
  }

  return files
    .map(
      (file) =>
        `// ===== ${file.path} =====\n${file.content}`,
    )
    .join("\n\n");
}

export default function StaticAnalysis() {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [projectName, setProjectName] = useState("Manual Scan");
  const [targetLanguage, setTargetLanguage] = useState("JavaScript");
  const [code, setCode] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [syntaxIssues, setSyntaxIssues] = useState([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);

  const validateBasicSyntax = (source) => {
    const pairs = [
      ["(", ")"],
      ["[", "]"],
      ["{", "}"],
    ];
    const issues = pairs
      .map(([open, close]) => ({
        label: `${open}${close}`,
        openCount: (source.match(new RegExp(`\\${open}`, "g")) || []).length,
        closeCount: (source.match(new RegExp(`\\${close}`, "g")) || []).length,
      }))
      .filter((item) => item.openCount !== item.closeCount)
      .map((item) => `${item.label} 괄호 개수가 맞지 않습니다.`);

    setSyntaxIssues(issues);

    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    const markers = issues.map((issue) => ({
      severity: monacoRef.current.MarkerSeverity.Warning,
      message: issue,
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    }));

    monacoRef.current.editor.setModelMarkers(model, "securelens", markers);
  };

  const updateCode = (value = "") => {
    setCode(value);
    validateBasicSyntax(value);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    validateBasicSyntax(code);
  };

  const saveAnalysis = ({
    vulnerabilities,
    scannedFiles,
    scanDuration,
    language,
    name = projectName,
  }) => {
    setResults(vulnerabilities);
    saveProject({
      name,
      language,
      scannedFiles,
      scanDuration,
      analyzedAt: new Date().toISOString(),
    });
    saveStaticResults(vulnerabilities);
    saveAiResults([]);
    saveFalsePositiveResults([]);
    saveScanFromFindings({
      fileName: name,
      vulnerabilities,
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
    updateCode(demoVulnerableCode);
    setResults([]);
    setMessage("Demo vulnerable code loaded. Click Analyze Code to scan it.");
  };

  const loadPythonDemoCode = () => {
    setProjectName("Demo Python Vulnerable App");
    setTargetLanguage("Python");
    updateCode(demoPythonVulnerableCode);
    setResults([]);
    setMessage("Demo Python vulnerable code loaded. Click Analyze Code to scan it.");
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    const files = await Promise.all(
      selectedFiles.map(async (file) => ({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        content: await file.text(),
      })),
    );
    const result = analyzeFiles(files);
    const uploadedProjectName =
      files.length === 1
        ? files[0].name
        : files[0].path.split("/")[0] || `${files.length} uploaded files`;
    const uploadedLanguage =
      files.length === 1 ? detectLanguageFromPath(files[0].path) : result.language;

    setProjectName(uploadedProjectName);
    setTargetLanguage(uploadedLanguage || "Unknown");
    updateCode(buildUploadedCodePreview(files));

    saveAnalysis({
      vulnerabilities: result.vulnerabilities,
      scannedFiles: result.scannedFiles,
      scanDuration: result.scanDuration,
      language: uploadedLanguage || result.language,
      name: uploadedProjectName,
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

          <Box
            sx={{
              border: "1px solid rgba(96,165,250,.2)",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "rgba(2,6,23,.72)",
            }}
          >
            <Editor
              height="420px"
              language={getEditorLanguage(targetLanguage)}
              theme="vs-dark"
              value={code}
              onChange={updateCode}
              onMount={handleEditorMount}
              options={{
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </Box>

          {syntaxIssues.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {syntaxIssues.join(" ")}
            </Alert>
          )}

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
            <Button variant="outlined" component="label">
              Upload Folder
              <input
                hidden
                multiple
                type="file"
                webkitdirectory=""
                directory=""
                onChange={handleFileUpload}
              />
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
              <VulnerabilityCard
                key={`${item.filePath}-${item.line}-${index}`}
                vulnerability={item}
                onClick={() => setSelectedVulnerability(item)}
              >
                <Typography>Severity: {item.severity}</Typography>
                <Typography>CWE: {item.cwe}</Typography>
                <Typography sx={{ overflowWrap: "anywhere" }}>{item.description}</Typography>
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
