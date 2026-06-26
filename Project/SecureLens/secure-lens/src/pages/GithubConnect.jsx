import { useEffect, useState } from "react";
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
import FolderIcon from "@mui/icons-material/Folder";
import GitHubIcon from "@mui/icons-material/GitHub";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import PageHeader from "../components/PageHeader";
import VulnerabilityCard from "../components/VulnerabilityCard";
import VulnerabilityDetailDialog from "../components/VulnerabilityDetailDialog";
import {
  analyzeFiles,
  detectLanguageFromPath,
  runStaticAnalysis,
} from "../services/analysisService";
import { runAIAnalysis } from "../services/aiAnalysisService";
import {
  isRealFinding,
  runFalsePositiveReview,
} from "../services/falsePositiveService";
import {
  saveScanFromFindings,
  updateLatestScanFromFindings,
} from "../services/scanHistoryService";
import {
  collectRepositoryFiles,
  fetchContents,
  fetchFileContent,
  fetchRepository,
  parseGitHubUrl,
} from "../services/githubService";
import {
  getGithubConnectState,
  saveAiResults,
  saveFalsePositiveResults,
  saveGithubConnectState,
  saveProject,
  saveStaticResults,
} from "../services/storageService";

const maxFileSize = 300 * 1024;

const initialWorkflowStatus = {
  static: "waiting",
  ai: "waiting",
  review: "waiting",
  report: "waiting",
};

export default function GithubConnect() {
  const navigate = useNavigate();
  const savedState = getGithubConnectState();
  const [repoUrl, setRepoUrl] = useState(savedState?.repoUrl || "");
  const [repoData, setRepoData] = useState(savedState?.repoData || null);
  const [owner, setOwner] = useState(savedState?.owner || "");
  const [repo, setRepo] = useState(savedState?.repo || "");
  const [currentPath, setCurrentPath] = useState(savedState?.currentPath || "");
  const [files, setFiles] = useState(savedState?.files || []);
  const [selectedFile, setSelectedFile] = useState(savedState?.selectedFile || "");
  const [fileContent, setFileContent] = useState(savedState?.fileContent || "");
  const [analysisResults, setAnalysisResults] = useState(savedState?.analysisResults || []);
  const [aiResults, setAiResults] = useState(savedState?.aiResults || []);
  const [reviewResults, setReviewResults] = useState(savedState?.reviewResults || []);
  const [message, setMessage] = useState(
    savedState?.message || "",
  );
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(
    savedState?.workflowStatus || initialWorkflowStatus,
  );
  const [analysisLanguage, setAnalysisLanguage] = useState(
    savedState?.analysisLanguage || "",
  );
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);

  useEffect(() => {
    saveGithubConnectState({
      repoUrl,
      repoData,
      owner,
      repo,
      currentPath,
      files,
      selectedFile,
      fileContent,
      analysisResults,
      aiResults,
      reviewResults,
      message,
      workflowStatus,
      analysisLanguage,
    });
  }, [
    aiResults,
    analysisLanguage,
    analysisResults,
    currentPath,
    fileContent,
    files,
    message,
    owner,
    repo,
    repoData,
    repoUrl,
    reviewResults,
    selectedFile,
    workflowStatus,
  ]);

  const loadContents = async (ownerName, repoName, path = "") => {
    const data = await fetchContents(ownerName, repoName, path);

    setFiles(Array.isArray(data) ? data : []);
    setCurrentPath(path);
  };

  const resetResults = () => {
    setAnalysisResults([]);
    setAiResults([]);
    setReviewResults([]);
    setSelectedFile("");
    setFileContent("");
    setAnalysisLanguage("");
    setWorkflowStatus({
      static: "ready",
      ai: "waiting",
      review: "waiting",
      report: "waiting",
    });
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setScanProgress(null);
      setMessage("");

      const parsed = parseGitHubUrl(repoUrl);
      const repository = await fetchRepository(parsed.owner, parsed.repo);
      const canonicalOwner = repository.owner?.login || parsed.owner;
      const canonicalRepo = repository.name || parsed.repo;

      setOwner(canonicalOwner);
      setRepo(canonicalRepo);
      setRepoData(repository);
      resetResults();
      setAnalysisLanguage(repository.language || "Unknown");
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
        setMessage("Repository connected. Click Run Full Workflow to analyze it.");
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

  // 정적 분석 결과를 공통 저장소와 마이페이지 히스토리에 함께 저장합니다.
  const saveStaticFindingSet = ({ fileName, vulnerabilities }) => {
    saveStaticResults(vulnerabilities);
    saveAiResults([]);
    saveFalsePositiveResults([]);
    saveScanFromFindings({
      fileName,
      vulnerabilities,
    });
  };

  const handleFileClick = async (path) => {
    try {
      setLoading(true);
      setScanProgress(null);
      const language = detectLanguageFromPath(path);

      const content = await fetchFileContent(owner, repo, path);
      const result = runStaticAnalysis(content).map((item) => ({
        ...item,
        filePath: path,
        fileName: path.split("/").pop(),
      }));

      setSelectedFile(path);
      setFileContent(content);
      setAnalysisLanguage(language);
      setAnalysisResults(result);
      setAiResults([]);
      setReviewResults([]);
      saveStaticFindingSet({
        fileName: path,
        vulnerabilities: result,
      });
      saveProject({
        owner,
        repo,
        url: repoData.html_url,
        name: path.split("/").pop(),
        language,
        scannedFiles: 1,
        scanDuration: 0,
        analyzedAt: new Date().toISOString(),
      });
      setWorkflowStatus({
        static: "done",
        ai: result.length > 0 ? "ready" : "waiting",
        review: "waiting",
        report: "waiting",
      });
      setMessage(`${result.length} static findings detected in ${path}.`);
    } catch (error) {
      setMessage(error.message || "Unable to load the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectoryClick = async (path) => {
    setSelectedFile("");
    setFileContent("");
    setAnalysisResults([]);
    setAiResults([]);
    setReviewResults([]);
    setWorkflowStatus({
      static: "ready",
      ai: "waiting",
      review: "waiting",
      report: "waiting",
    });
    await loadContents(owner, repo, path);
    setMessage(`Folder selected. Run Full Workflow to scan files inside ${path}.`);
  };

  const runSelectedFileStaticAnalysis = () => {
    const startedAt = performance.now();
    const vulnerabilities = runStaticAnalysis(fileContent).map((item) => ({
      ...item,
      filePath: selectedFile,
      fileName: selectedFile.split("/").pop(),
    }));
    const scanDuration = Number(((performance.now() - startedAt) / 1000).toFixed(2));
    const language = detectLanguageFromPath(selectedFile);
    const severityCounts = vulnerabilities.reduce(
      (counts, item) => ({
        ...counts,
        [item.severity]: (counts[item.severity] || 0) + 1,
      }),
      { HIGH: 0, MEDIUM: 0, LOW: 0 },
    );

    saveStaticFindingSet({
      fileName: selectedFile,
      vulnerabilities,
    });
    saveProject({
      owner,
      repo,
      url: repoData.html_url,
      name: selectedFile.split("/").pop(),
      language,
      scannedFiles: 1,
      scanDuration,
      severityCounts,
      analyzedAt: new Date().toISOString(),
    });
    setAnalysisLanguage(language);

    return {
      vulnerabilities,
      language,
      scanFileName: selectedFile,
      scannedFiles: 1,
      scanDuration,
      severityCounts,
      skippedLargeFiles: 0,
      skippedUnreadableFiles: 0,
    };
  };

  const runRepositoryStaticAnalysis = async () => {
    const targetPath = currentPath || "";
    const targetName = targetPath || repoData.name;

    setScanProgress(null);
    setMessage(
      targetPath
        ? `Collecting supported source files from ${targetPath}.`
        : "Collecting supported source files from the repository.",
    );

    const repositoryFiles = await collectRepositoryFiles(
      owner,
      repo,
      targetPath,
      40,
      repoData.default_branch || "HEAD",
    );
    const eligibleFiles = repositoryFiles.filter(
      (file) => !file.size || file.size <= maxFileSize,
    );
    const skippedLargeFiles = repositoryFiles.length - eligibleFiles.length;
    const filesWithContent = [];
    let skippedUnreadableFiles = 0;

    for (let index = 0; index < eligibleFiles.length; index += 1) {
      const file = eligibleFiles[index];

      setScanProgress({
        current: index + 1,
        total: eligibleFiles.length,
        fileName: file.path,
        skippedLargeFiles,
      });

      try {
        const content = await fetchFileContent(owner, repo, file.path);
        filesWithContent.push({
          path: file.path,
          name: file.name,
          content,
        });
      } catch {
        skippedUnreadableFiles += 1;
      }
    }

    if (filesWithContent.length === 0) {
      throw new Error(
        "No readable source files were found. Select a file in the explorer and run the workflow again.",
      );
    }

    const result = analyzeFiles(filesWithContent);

    saveStaticFindingSet({
      fileName: targetName,
      vulnerabilities: result.vulnerabilities,
    });
    saveProject({
      owner,
      repo,
      url: repoData.html_url,
      name: targetName,
      language: result.language || repoData.language,
      scannedFiles: result.scannedFiles,
      scanDuration: result.scanDuration,
      severityCounts: result.severityCounts,
      analyzedAt: new Date().toISOString(),
    });
    setAnalysisLanguage(result.language || repoData.language || "Unknown");

    return {
      ...result,
      scanFileName: targetName,
      skippedLargeFiles,
      skippedUnreadableFiles,
    };
  };

  // GitHub Connect의 핵심 워크플로우입니다.
  // 1. 정적 분석으로 후보 취약점을 찾고
  // 2. AI 분석으로 공격 가능성과 수정 방법을 보강한 뒤
  // 3. 오탐 검토로 실제 조치할 항목만 남기고
  // 4. 리포트 화면으로 넘길 최종 결과를 저장합니다.
  const handleRunFullWorkflow = async () => {
    try {
      setLoading(true);
      setWorkflowStatus({
        static: "running",
        ai: "waiting",
        review: "waiting",
        report: "waiting",
      });

      const staticResult =
        selectedFile && fileContent
          ? runSelectedFileStaticAnalysis()
          : await runRepositoryStaticAnalysis();
      setAnalysisResults(staticResult.vulnerabilities);
      setAiResults([]);
      setReviewResults([]);

      setWorkflowStatus({
        static: "done",
        ai: "running",
        review: "waiting",
        report: "waiting",
      });
      setMessage("Running AI path analysis.");

      const aiResult = await runAIAnalysis("", staticResult.vulnerabilities);
      setAiResults(aiResult);
      saveAiResults(aiResult);

      setWorkflowStatus({
        static: "done",
        ai: "done",
        review: "running",
        report: "waiting",
      });

      const reviewed = runFalsePositiveReview(aiResult);
      const realOnly = reviewed.filter(isRealFinding);
      const falsePositiveCount = reviewed.length - realOnly.length;
      setReviewResults(reviewed);
      saveFalsePositiveResults(reviewed);
      updateLatestScanFromFindings({
        fileName: staticResult.scanFileName,
        vulnerabilities: realOnly,
        falsePositiveCount,
      });

      setWorkflowStatus({
        static: "done",
        ai: "done",
        review: "done",
        report: "ready",
      });
      setMessage(
        `Workflow complete. ${staticResult.scannedFiles} files scanned, ${realOnly.length} actionable findings remain.${
          staticResult.skippedLargeFiles > 0
            ? ` ${staticResult.skippedLargeFiles} large files skipped.`
            : ""
        }${
          staticResult.skippedUnreadableFiles > 0
            ? ` ${staticResult.skippedUnreadableFiles} unreadable files skipped.`
            : ""
        }`,
      );
    } catch (error) {
      setMessage(error.message || "Workflow failed.");
      setWorkflowStatus((current) => ({
        ...current,
        [Object.keys(current).find((key) => current[key] === "running") || "static"]:
          "error",
      }));
    } finally {
      setLoading(false);
      setScanProgress(null);
    }
  };

  const goBack = async () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    setSelectedFile("");
    setFileContent("");
    await loadContents(owner, repo, parentPath);
  };

  const workflow = [
    {
      key: "static",
      title: "Static Analysis",
      count: analysisResults.length,
      status: workflowStatus.static,
    },
    {
      key: "ai",
      title: "AI Analysis",
      count: aiResults.length,
      status: workflowStatus.ai,
    },
    {
      key: "review",
      title: "Review",
      count: reviewResults.length - reviewResults.filter(isRealFinding).length,
      status: workflowStatus.review,
    },
    {
      key: "report",
      title: "Report",
      count: reviewResults.filter(isRealFinding).length,
      status: workflowStatus.report,
    },
  ];
  const visibleResults =
    reviewResults.length > 0 ? reviewResults.filter(isRealFinding) : analysisResults;

  const getStatusText = (step) => {
    if (step.status === "running") return "Running";
    if (step.status === "done" && step.key === "review") {
      return `${step.count} filtered`;
    }
    if (step.status === "done" && step.key === "report") {
      return `${step.count} final`;
    }
    if (step.status === "done") return `${step.count} items`;
    if (step.status === "ready" && step.key === "report") {
      return `${step.count} final`;
    }
    if (step.status === "ready") return "Ready";
    if (step.status === "error") return "Failed";
    return "Waiting";
  };

  const getStatusStyle = (status) => {
    if (status === "running") {
      return {
        borderColor: "rgba(96,165,250,.45)",
        background: "rgba(37,99,235,.2)",
      };
    }

    if (status === "done" || status === "ready") {
      return {
        borderColor: "rgba(34,197,94,.34)",
        background: "rgba(34,197,94,.1)",
      };
    }

    if (status === "error") {
      return {
        borderColor: "rgba(239,68,68,.42)",
        background: "rgba(239,68,68,.1)",
      };
    }

    return {
      borderColor: "rgba(96,165,250,.16)",
      background: "rgba(15,23,42,.58)",
    };
  };

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
                disabled={loading || !repoUrl.trim()}
                sx={{ minWidth: 140 }}
              >
                Connect
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mt: 2 }} />}
          {scanProgress && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.75 }}>
                <Typography color="text.secondary" fontSize={13}>
                  Scanning {scanProgress.current} / {scanProgress.total}
                </Typography>
                {scanProgress.skippedLargeFiles > 0 && (
                  <Typography color="text.secondary" fontSize={13}>
                    Skipped {scanProgress.skippedLargeFiles} large files
                  </Typography>
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={
                  scanProgress.total > 0
                    ? Math.round((scanProgress.current / scanProgress.total) * 100)
                    : 0
                }
              />
              <Typography
                color="text.secondary"
                fontSize={12}
                sx={{ mt: 0.75, overflowWrap: "anywhere" }}
              >
                {scanProgress.fileName}
              </Typography>
            </Box>
          )}
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
                    <Chip label={analysisLanguage || repoData.language || "Unknown"} />
                    <Chip label={`Stars ${repoData.stargazers_count}`} />
                    <Chip label={`Forks ${repoData.forks_count}`} />
                    <Chip label={repoData.private ? "Private" : "Public"} />
                  </Stack>
                </Box>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleRunFullWorkflow}
                    disabled={loading}
                  >
                    {loading ? "Running Workflow" : "Run Full Workflow"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate("/report")}
                    disabled={workflowStatus.report !== "ready"}
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
                {workflow.map((step, index) => (
                  <Box
                    key={step.key}
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      border: "1px solid",
                      minWidth: 0,
                      ...getStatusStyle(step.status),
                    }}
                  >
                    <Typography color="text.secondary" fontSize={12} fontWeight={800}>
                      STEP {index + 1}
                    </Typography>
                    <Typography fontWeight={900}>{step.title}</Typography>
                    <Typography color="text.secondary" fontSize={13}>
                      {getStatusText(step)}
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
                          handleDirectoryClick(file.path);
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

                  {visibleResults.length === 0 ? (
                    <Typography color="text.secondary">
                      {reviewResults.length > 0
                        ? "No final vulnerabilities remain after false-positive review."
                        : "No static results yet."}
                    </Typography>
                  ) : (
                    visibleResults.map((vuln, index) => (
                      <VulnerabilityCard
                        key={`${vuln.filePath}-${vuln.line}-${index}`}
                        vulnerability={vuln}
                        onClick={() => setSelectedVulnerability(vuln)}
                      >
                        <Typography>CWE: {vuln.cwe}</Typography>
                        <Typography sx={{ overflowWrap: "anywhere" }}>
                          {vuln.description}
                        </Typography>
                      </VulnerabilityCard>
                    ))
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}

      <VulnerabilityDetailDialog
        vulnerability={selectedVulnerability}
        onClose={() => setSelectedVulnerability(null)}
      />
    </Box>
  );
}
