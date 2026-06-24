import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FolderIcon from "@mui/icons-material/Folder";
import GitHubIcon from "@mui/icons-material/GitHub";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import PageHeader from "../components/PageHeader";
import { analyzeFiles, runStaticAnalysis } from "../services/analysisService";
import { runAIAnalysis } from "../services/aiAnalysisService";
import { runFalsePositiveReview } from "../services/falsePositiveService";
import {
  collectRepositoryFiles,
  fetchContents,
  fetchFileContent,
  fetchRepository,
  parseGitHubUrl,
} from "../services/githubService";
import {
  saveAiResults,
  saveFalsePositiveResults,
  saveProject,
  saveStaticResults,
} from "../services/storageService";

export default function GithubConnect() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [analysisResults, setAnalysisResults] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [reviewResults, setReviewResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState("connect");

  const loadContents = async (ownerName, repoName, path = "") => {
    const data = await fetchContents(ownerName, repoName, path);

    setFiles(Array.isArray(data) ? data : []);
    setCurrentPath(path);
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setMessage("");

      const parsed = parseGitHubUrl(repoUrl);
      const repository = await fetchRepository(parsed.owner, parsed.repo);
      const canonicalOwner = repository.owner?.login || parsed.owner;
      const canonicalRepo = repository.name || parsed.repo;

      setOwner(canonicalOwner);
      setRepo(canonicalRepo);
      setRepoData(repository);
      setAnalysisResults([]);
      setAiResults([]);
      setReviewResults([]);
      setActiveStage("static");
      saveProject({
        owner: canonicalOwner,
        repo: canonicalRepo,
        url: repository.html_url,
        name: repository.name,
        language: repository.language,
        connectedAt: new Date().toISOString(),
      });

      try {
        await loadContents(canonicalOwner, canonicalRepo);
        setMessage("Repository connected. Run static analysis to start the workflow.");
      } catch (contentError) {
        setFiles([]);
        setMessage(
          `Repository connected, but the file explorer could not load: ${contentError.message}`,
        );
      }
    } catch (error) {
      setMessage(error.message || "Unable to load the repository.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSubmit = (event) => {
    event.preventDefault();

    if (!loading && repoUrl.trim()) {
      handleConnect();
    }
  };

  const handleFileClick = async (path) => {
    try {
      setLoading(true);
      const content = await fetchFileContent(owner, repo, path);
      const result = runStaticAnalysis(content).map((item) => ({
        ...item,
        filePath: path,
        fileName: path.split("/").pop(),
      }));

      setSelectedFile(path);
      setFileContent(content);
      setAnalysisResults(result);
      setAiResults([]);
      setReviewResults([]);
      saveStaticResults(result);
      setActiveStage("ai");
      setMessage(`${result.length} static findings detected in ${path}.`);
    } catch (error) {
      setMessage(error.message || "Unable to load the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeRepository = async () => {
    try {
      setLoading(true);
      setMessage("Collecting supported source files from the repository.");

      const repositoryFiles = await collectRepositoryFiles(
        owner,
        repo,
        "",
        40,
        repoData.default_branch || "HEAD",
      );
      const filesWithContent = [];

      for (const file of repositoryFiles) {
        const content = await fetchFileContent(owner, repo, file.path);
        filesWithContent.push({
          path: file.path,
          name: file.name,
          content,
        });
      }

      const result = analyzeFiles(filesWithContent);

      saveStaticResults(result.vulnerabilities);
      saveProject({
        owner,
        repo,
        url: repoData.html_url,
        name: repoData.name,
        language: repoData.language,
        scannedFiles: result.scannedFiles,
        scanDuration: result.scanDuration,
        severityCounts: result.severityCounts,
        analyzedAt: new Date().toISOString(),
      });
      setAnalysisResults(result.vulnerabilities);
      setAiResults([]);
      setReviewResults([]);
      setActiveStage("ai");
      setMessage(
        `${result.scannedFiles} files scanned. ${result.vulnerabilities.length} static findings detected.`,
      );
    } catch (error) {
      setMessage(error.message || "Repository analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (analysisResults.length === 0) {
      setMessage("Run static analysis before AI analysis.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Running AI path analysis.");

      const result = await runAIAnalysis(fileContent, analysisResults);

      setAiResults(result);
      setReviewResults([]);
      saveAiResults(result);
      setActiveStage("review");
      setMessage(`${result.length} findings reviewed by AI.`);
    } catch (error) {
      setMessage(error.message || "AI analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFalsePositiveReview = () => {
    if (aiResults.length === 0) {
      setMessage("Run AI analysis before false-positive review.");
      return;
    }

    const reviewed = runFalsePositiveReview(aiResults);
    const realOnly = reviewed.filter((item) => item.status === "REAL");

    setReviewResults(reviewed);
    saveFalsePositiveResults(reviewed);
    saveAiResults(realOnly);
    setActiveStage("report");
    setMessage(
      `${realOnly.length} real findings remain. ${reviewed.length - realOnly.length} false positives filtered.`,
    );
  };

  const goBack = async () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    await loadContents(owner, repo, parentPath);
  };

  const workflow = [
    {
      key: "static",
      title: "1. Static",
      count: analysisResults.length,
      ready: Boolean(repoData),
    },
    {
      key: "ai",
      title: "2. AI",
      count: aiResults.length,
      ready: analysisResults.length > 0,
    },
    {
      key: "review",
      title: "3. Review",
      count: reviewResults.length,
      ready: aiResults.length > 0,
    },
    {
      key: "report",
      title: "4. Report",
      count: reviewResults.filter((item) => item.status === "REAL").length,
      ready: reviewResults.length > 0,
    },
  ];

  return (
    <Box sx={{ minWidth: 0 }}>
      <PageHeader
        title="GitHub Repository"
        subtitle="Connect a public repository and run the SecureLens workflow from static detection to AI review, false-positive filtering, and report generation."
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleConnectSubmit}>
            <Typography color="text.secondary" fontSize={14} fontWeight={700} mb={1}>
              Repository URL
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              <TextField
                fullWidth
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                inputProps={{ "aria-label": "Repository URL" }}
              />

              <Button
                type="submit"
                variant="contained"
                startIcon={<GitHubIcon />}
                onClick={handleConnect}
                disabled={loading || !repoUrl.trim()}
                sx={{ minWidth: 140 }}
              >
                Connect
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mt: 2 }} />}
          {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
        </CardContent>
      </Card>

      {repoData && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ overflowWrap: "anywhere" }}>
                    {repoData.name}
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    <Chip label={repoData.language || "Unknown"} />
                    <Chip label={`Stars ${repoData.stargazers_count}`} />
                    <Chip label={`Forks ${repoData.forks_count}`} />
                    <Chip label={repoData.private ? "Private" : "Public"} />
                  </Stack>
                </Box>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleAnalyzeRepository}
                    disabled={loading}
                  >
                    Static Analysis
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AutoFixHighIcon />}
                    onClick={handleAIAnalysis}
                    disabled={loading || analysisResults.length === 0}
                  >
                    AI Analysis
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FactCheckIcon />}
                    onClick={handleFalsePositiveReview}
                    disabled={loading || aiResults.length === 0}
                  >
                    Review
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate("/report")}
                    disabled={reviewResults.length === 0}
                  >
                    Report
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                  mt: 3,
                }}
              >
                {workflow.map((step) => (
                  <Box
                    key={step.key}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid rgba(96,165,250,.16)",
                      background:
                        activeStage === step.key
                          ? "rgba(37,99,235,.2)"
                          : "rgba(15,23,42,.58)",
                      minWidth: 0,
                    }}
                  >
                    <Typography fontWeight={800}>{step.title}</Typography>
                    <Typography color="text.secondary" fontSize={13}>
                      {step.ready ? `${step.count} items` : "Waiting"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Card sx={{ minWidth: 0 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  File Explorer
                </Typography>

                {currentPath && (
                  <Button size="small" onClick={goBack}>
                    Back
                  </Button>
                )}

                <Divider sx={{ my: 2 }} />

                <List dense sx={{ maxHeight: 560, overflow: "auto" }}>
                  {files.map((file) => (
                    <ListItemButton
                      key={file.path}
                      onClick={() => {
                        if (file.type === "dir") {
                          loadContents(owner, repo, file.path);
                        } else {
                          handleFileClick(file.path);
                        }
                      }}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {file.type === "dir" ? (
                        <FolderIcon sx={{ mr: 1, flexShrink: 0 }} />
                      ) : (
                        <InsertDriveFileIcon sx={{ mr: 1, flexShrink: 0 }} />
                      )}
                      <ListItemText
                        primary={file.name}
                        primaryTypographyProps={{
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Box sx={{ minWidth: 0 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" mb={1}>
                    Code Viewer
                  </Typography>
                  <Typography color="text.secondary" mb={2} sx={{ overflowWrap: "anywhere" }}>
                    {selectedFile || "Select a file to preview it."}
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      maxHeight: 340,
                      overflow: "auto",
                      textAlign: "left",
                      p: 2,
                      m: 0,
                      borderRadius: 2,
                      bgcolor: "rgba(2,6,23,.72)",
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {fileContent || "// Repository static analysis can run without selecting a file."}
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Workflow Results
                  </Typography>

                  {analysisResults.length === 0 ? (
                    <Typography color="text.secondary">No static results yet.</Typography>
                  ) : (
                    analysisResults.map((vuln, index) => (
                      <Card
                        key={`${vuln.filePath}-${vuln.line}-${index}`}
                        sx={{ mb: 2, p: 2, minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography fontWeight="bold" sx={{ overflowWrap: "anywhere" }}>
                            {vuln.type}
                          </Typography>
                          <Chip size="small" label={vuln.severity} />
                        </Box>
                        <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                          {vuln.filePath}:{vuln.line}
                        </Typography>
                        <Typography>CWE: {vuln.cwe}</Typography>
                        <Typography sx={{ overflowWrap: "anywhere" }}>
                          {vuln.description}
                        </Typography>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
