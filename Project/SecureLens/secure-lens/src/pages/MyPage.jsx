import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { deleteCurrentAccount } from "../services/authService";
import { buildScanStats, getScanHistory } from "../services/scanHistoryService";
import {
  clearAnalysisData,
  saveAiResults,
  saveFalsePositiveResults,
  saveProject,
  saveStaticResults,
  SECURE_LENS_STORAGE_EVENT,
} from "../services/storageService";

const SEVERITY_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

function loadMyPageData() {
  const scanHistory = getScanHistory();

  return {
    scanHistory,
    stats: buildScanStats(scanHistory),
  };
}

function SeverityBar({ label, count, total }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Box sx={{ mb: 2.25 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.75 }}>
        <Typography fontWeight={800}>{label}</Typography>
        <Typography color="text.secondary">
          {count} items / {percent}%
        </Typography>
      </Box>
      <Box
        sx={{
          height: 12,
          borderRadius: 999,
          background: "rgba(148,163,184,.14)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: 999,
            background: SEVERITY_COLORS[label],
            transition: "width .25s ease",
          }}
        />
      </Box>
    </Box>
  );
}

function scanHasSeverity(scan, severity) {
  if (severity === "All") return true;

  return scan.vulnerabilities.some((vulnerability) => vulnerability.severity === severity);
}

function scanInDateRange(scan, startDate, endDate) {
  const scanDate = scan.scanDate?.slice(0, 10);

  if (startDate && scanDate < startDate) return false;
  if (endDate && scanDate > endDate) return false;

  return true;
}

function FilterFieldFrame({ label, children }) {
  return (
    <Box
      sx={{
        position: "relative",
        height: 60,
        border: "1px solid rgba(148,163,184,.24)",
        borderRadius: "14px",
        background: "rgba(2,6,23,.24)",
        minWidth: 0,
        transition: "border-color .18s ease, box-shadow .18s ease",
        "&:hover": {
          borderColor: "rgba(148,163,184,.42)",
        },
        "&:focus-within": {
          borderColor: "rgba(59,130,246,.85)",
          boxShadow: "0 0 0 3px rgba(59,130,246,.14)",
        },
      }}
    >
      <Typography
        component="label"
        color="text.secondary"
        fontSize={12}
        fontWeight={700}
        sx={{
          position: "absolute",
          top: -8,
          left: 12,
          zIndex: 1,
          px: 0.75,
          lineHeight: 1,
          backgroundColor: "background.paper",
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function SeverityFilterField({ value, onChange }) {
  return (
    <FilterFieldFrame label="위험도">
      <Box
        component="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="위험도"
        sx={{
          appearance: "none",
          boxSizing: "border-box",
          width: "100%",
          height: "100%",
          border: 0,
          outline: 0,
          borderRadius: "14px",
          background: "transparent",
          color: value ? "text.primary" : "text.secondary",
          px: 2,
          pr: 4,
          font: "inherit",
          fontSize: 16,
          fontWeight: 400,
          letterSpacing: 0,
          cursor: "pointer",
        }}
      >
        <Box component="option" value="All" sx={{ backgroundColor: "#0f172a" }}>
          All
        </Box>
        <Box component="option" value="High" sx={{ backgroundColor: "#0f172a" }}>
          High
        </Box>
        <Box component="option" value="Medium" sx={{ backgroundColor: "#0f172a" }}>
          Medium
        </Box>
        <Box component="option" value="Low" sx={{ backgroundColor: "#0f172a" }}>
          Low
        </Box>
      </Box>
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: "50%",
          right: 16,
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "6px solid currentColor",
          color: "text.secondary",
          pointerEvents: "none",
          transform: "translateY(-25%)",
        }}
      />
    </FilterFieldFrame>
  );
}

function DateFilterField({ label, value, onChange }) {
  return (
    <FilterFieldFrame label={label}>
      <Box
        component="input"
        type="date"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          boxSizing: "border-box",
          width: "100%",
          height: "100%",
          border: 0,
          outline: 0,
          borderRadius: "14px",
          background: "transparent",
          color: value ? "text.primary" : "text.secondary",
          colorScheme: "dark",
          px: 2,
          pr: 1.75,
          font: "inherit",
          fontSize: 16,
          fontWeight: 400,
          letterSpacing: 0,
          "&::-webkit-calendar-picker-indicator": {
            cursor: "pointer",
            opacity: 0.58,
          },
        }}
      />
    </FilterFieldFrame>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(loadMyPageData);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const refresh = () => setPageData(loadMyPageData());

    window.addEventListener(SECURE_LENS_STORAGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(SECURE_LENS_STORAGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const handleClearData = () => {
    clearAnalysisData();
    setPageData(loadMyPageData());
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "계정을 삭제하면 로그인 정보와 분석 데이터가 함께 삭제됩니다. 계속할까요?",
    );

    if (!confirmed) return;

    try {
      deleteCurrentAccount();
      navigate("/login", { replace: true });
      window.location.reload();
    } catch (error) {
      window.alert(error.message);
    }
  };

  const handleOpenScan = (scan) => {
    saveProject({
      ...(scan.projectSnapshot || {}),
      name: scan.projectSnapshot?.name || scan.fileName,
      analyzedAt: scan.scanDate,
      scannedFiles: scan.projectSnapshot?.scannedFiles || 1,
      scanDuration: scan.projectSnapshot?.scanDuration || 0,
    });
    saveStaticResults(scan.vulnerabilities);
    saveAiResults([]);
    saveFalsePositiveResults([]);
    navigate("/dashboard");
  };

  const { scanHistory, stats } = pageData;
  const filteredScans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...scanHistory]
      .reverse()
      .filter((scan) =>
        normalizedQuery
          ? `${scan.fileName} ${scan.projectSnapshot?.name || ""}`
              .toLowerCase()
              .includes(normalizedQuery)
          : true,
      )
      .filter((scan) => scanHasSeverity(scan, severity))
      .filter((scan) => scanInDateRange(scan, startDate, endDate));
  }, [endDate, query, scanHistory, severity, startDate]);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <PageHeader
          title="My Page"
          subtitle="분석 이력과 취약점 통계를 확인하고, 이전 분석 결과를 다시 열어볼 수 있습니다."
        />
        <Button variant="outlined" color="error" onClick={handleClearData}>
          Clear Analysis Data
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="총 검사 횟수" value={stats.totalScans} />
        <StatCard label="최종 누적 취약점 수" value={stats.totalVulnerabilities} />
        <StatCard
          label="오탐으로 제외된 취약점 수"
          value={stats.totalFalsePositives}
          helper="AI/오탐 검토 후 최종 결과에서 제외된 항목"
        />
        <StatCard
          label="여태까지 고친 총 취약점 수"
          value={stats.totalFixed}
          helper="동일 파일의 직전 검사와 비교해 사라진 항목"
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={3}>
            위험도별 누적 통계
          </Typography>
          {["High", "Medium", "Low"].map((item) => (
            <SeverityBar
              key={item}
              label={item}
              count={stats.severityCounts[item] || 0}
              total={stats.totalVulnerabilities}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Typography variant="h6">분석 히스토리</Typography>
            <Chip label={`${filteredScans.length} results`} />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(320px, 1fr) 176px 180px 180px",
              },
              gap: 2.25,
              alignItems: "start",
              mb: 3,
            }}
          >
            <TextField
              label="파일명 또는 저장소 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  height: 60,
                  borderRadius: "14px",
                },
              }}
            />
            <SeverityFilterField value={severity} onChange={setSeverity} />
            <DateFilterField
              label="시작일"
              value={startDate}
              onChange={setStartDate}
            />
            <DateFilterField
              label="종료일"
              value={endDate}
              onChange={setEndDate}
            />
          </Box>

          {filteredScans.length === 0 ? (
            <Box
              sx={{
                border: "1px dashed rgba(148,163,184,.28)",
                borderRadius: "14px",
                background: "rgba(15,23,42,.32)",
                px: 2.5,
                py: 2.25,
              }}
            >
              <Typography color="text.secondary" fontWeight={800}>
                조건에 맞는 분석 기록이 없습니다. 정적 분석이나 GitHub 분석을 먼저 실행해 주세요.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>파일명 또는 저장소</TableCell>
                    <TableCell>검사일</TableCell>
                    <TableCell align="right">보안 점수</TableCell>
                    <TableCell align="right">High</TableCell>
                    <TableCell align="right">Medium</TableCell>
                    <TableCell align="right">Low</TableCell>
                    <TableCell align="right">발견</TableCell>
                    <TableCell align="right">오탐</TableCell>
                    <TableCell align="right">고침</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredScans.map((scan) => (
                    <TableRow
                      hover
                      key={scan.scanId}
                      onClick={() => handleOpenScan(scan)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ overflowWrap: "anywhere", maxWidth: 360 }}>
                        {scan.fileName}
                      </TableCell>
                      <TableCell>{scan.scanDate}</TableCell>
                      <TableCell align="right">
                        <Chip label={scan.securityScore ?? 0} size="small" />
                      </TableCell>
                      <TableCell align="right">{scan.severityCounts?.High || 0}</TableCell>
                      <TableCell align="right">{scan.severityCounts?.Medium || 0}</TableCell>
                      <TableCell align="right">{scan.severityCounts?.Low || 0}</TableCell>
                      <TableCell align="right">
                        <Chip label={scan.vulnerabilities.length} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={scan.falsePositiveCount || 0}
                          size="small"
                          color={(scan.falsePositiveCount || 0) > 0 ? "warning" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={scan.fixedCount || 0}
                          size="small"
                          color={(scan.fixedCount || 0) > 0 ? "success" : "default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 3, borderColor: "rgba(239,68,68,.35)" }}>
        <CardContent>
          <Typography variant="h6" color="error" mb={1}>
            계정 관리
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            계정을 삭제하면 현재 브라우저에 저장된 로그인 정보와 분석 데이터가 함께 삭제됩니다.
          </Typography>
          <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
            계정 삭제
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
