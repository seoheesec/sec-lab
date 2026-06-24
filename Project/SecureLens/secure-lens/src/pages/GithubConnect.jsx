import { useState } from "react";

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
  Typography,
  TextField,
} from "@mui/material";

import FolderIcon from "@mui/icons-material/Folder";
import GitHubIcon from "@mui/icons-material/GitHub";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { analyzeFiles, runStaticAnalysis } from "../services/analysisService";
import {
  collectRepositoryFiles,
  fetchContents,
  fetchFileContent,
  fetchRepository,
  parseGitHubUrl,
} from "../services/githubService";
import {
  saveProject,
  saveStaticResults,
} from "../services/storageService";

export default function GithubConnect() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [analysisResults, setAnalysisResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

      setOwner(parsed.owner);
      setRepo(parsed.repo);
      setRepoData(repository);
      saveProject({
        owner: parsed.owner,
        repo: parsed.repo,
        url: repository.html_url,
        name: repository.name,
        language: repository.language,
        connectedAt: new Date().toISOString(),
      });

      await loadContents(parsed.owner, parsed.repo);
      setMessage("저장소가 연결되었습니다.");
    } catch (error) {
      setMessage(error.message || "저장소를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
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
    } catch (error) {
      setMessage(error.message || "파일을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeRepository = async () => {
    try {
      setLoading(true);
      setMessage("분석 가능한 파일을 수집하고 있습니다.");

      const repositoryFiles = await collectRepositoryFiles(owner, repo);
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
      setMessage(
        `${result.scannedFiles}개 파일을 분석했고 ${result.vulnerabilities.length}개 항목을 찾았습니다.`,
      );
    } catch (error) {
      setMessage(error.message || "저장소 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    await loadContents(owner, repo, parentPath);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        GitHub Repository
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Repository URL"
              placeholder="https://github.com/facebook/react"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            />

            <Button
              variant="contained"
              startIcon={<GitHubIcon />}
              onClick={handleConnect}
              disabled={loading || !repoUrl.trim()}
            >
              Connect
            </Button>
          </Box>

          {loading && <LinearProgress sx={{ mt: 2 }} />}
          {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
        </CardContent>
      </Card>

      {repoData && (
        <Box sx={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 3 }}>
          <Card>
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

              <List dense>
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
                  >
                    {file.type === "dir" ? (
                      <FolderIcon sx={{ mr: 1 }} />
                    ) : (
                      <InsertDriveFileIcon sx={{ mr: 1 }} />
                    )}
                    <ListItemText primary={file.name} />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>

          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5">{repoData.name}</Typography>
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label={repoData.language || "Unknown"} />
                  <Chip label={`Stars ${repoData.stargazers_count}`} />
                  <Chip label={`Forks ${repoData.forks_count}`} />
                  <Chip label={repoData.private ? "Private" : "Public"} />
                </Box>

                <Button
                  sx={{ mt: 3 }}
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleAnalyzeRepository}
                  disabled={loading}
                >
                  Analyze Repository
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={1}>
                  Code Viewer
                </Typography>
                <Typography color="text.secondary" mb={2}>
                  {selectedFile || "파일을 선택하세요."}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    maxHeight: 360,
                    overflow: "auto",
                    textAlign: "left",
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "rgba(2,6,23,.7)",
                    fontSize: 13,
                  }}
                >
                  {fileContent}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Static Analysis Result
                </Typography>

                {analysisResults.length === 0 ? (
                  <Typography color="text.secondary">No Results</Typography>
                ) : (
                  analysisResults.map((vuln, index) => (
                    <Card key={`${vuln.filePath}-${vuln.line}-${index}`} sx={{ mb: 2, p: 2 }}>
                      <Typography fontWeight="bold">{vuln.type}</Typography>
                      <Typography color="text.secondary">
                        {vuln.filePath}:{vuln.line}
                      </Typography>
                      <Typography>Severity: {vuln.severity}</Typography>
                      <Typography>CWE: {vuln.cwe}</Typography>
                      <Typography>{vuln.description}</Typography>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
}
