import { create } from "zustand";
import {
  getAnalysisDetail,
  requestReScan,
  startStaticAnalysis,
} from "../features/analysis/analysisApi";

const frameworkByLanguage = {
  JAVA: "Spring Boot",
  JS: "Express",
  PYTHON: "FastAPI",
  GO: "Gin",
  CPP: "Native C/C++",
  RUST: "Rust Standard",
  PHP: "Laravel",
  RUBY: "Rails",
  KOTLIN: "Android/Kotlin",
};

export const useAnalysisStore = create((set, get) => ({
  selectedRepo: null,
  projectName: "",
  targetLanguage: "JAVA",
  targetFramework: "Spring Boot",
  targetBranch: "main",
  ruleProfile: "Full-Scope",

  isScanning: false,
  scanProgress: 0,
  scanLogs: [],
  isComplete: false,
  generatedReportId: null,
  isVulnerabilityFixed: false,
  analysisDetail: null,
  activeTimer: null,

  setSelectedRepo: (repo) => {
    if (get().isScanning) return;

    const language = repo.defaultLang || "JAVA";
    set({
      selectedRepo: repo,
      projectName: repo.name,
      targetLanguage: language,
      targetFramework: frameworkByLanguage[language] || "Standard Base",
      targetBranch: repo.branches?.[0] || "main",
      isComplete: false,
      generatedReportId: null,
      isVulnerabilityFixed: false,
      analysisDetail: null,
      scanProgress: 0,
      scanLogs: [],
    });
  },

  setProjectName: (name) => set({ projectName: name }),
  setTargetBranch: (branch) => set({ targetBranch: branch }),
  setRuleProfile: (profile) => set({ ruleProfile: profile }),
  setTargetFramework: (framework) => set({ targetFramework: framework }),
  setLanguage: (language) =>
    set({
      targetLanguage: language,
      targetFramework: frameworkByLanguage[language] || "Standard Base",
    }),

  stopAnalysisPipeline: () => {
    const timer = get().activeTimer;
    if (timer) clearInterval(timer);
    set({ activeTimer: null, isScanning: false });
  },

  startAnalysisPipeline: async (
    isReScanAction = false,
    addAnalyzedProject,
    navigateCallback,
  ) => {
    const state = get();

    if (!state.projectName.trim()) {
      alert("프로젝트 이름을 입력해 주세요.");
      return;
    }

    if (state.activeTimer) clearInterval(state.activeTimer);

    set({
      isScanning: true,
      isComplete: false,
      scanProgress: 0,
      scanLogs: [
        isReScanAction
          ? "[Re-Scan] 변경된 소스코드를 다시 분석합니다."
          : "[Step 1] 저장소 분석 요청을 생성합니다.",
      ],
      activeTimer: null,
    });

    try {
      const payload = {
        scanId: state.generatedReportId,
        repositoryId: state.selectedRepo?.id,
        repositoryUrl: state.selectedRepo?.url,
        projectName: state.projectName,
        targetLanguage: state.targetLanguage,
        targetFramework: state.targetFramework,
        targetBranch: state.targetBranch,
        ruleProfile: state.ruleProfile,
      };

      const response = isReScanAction
        ? await requestReScan(payload)
        : await startStaticAnalysis(payload);

      let stageIdx = 0;
      const timer = setInterval(async () => {
        const stages = response.stages || [];

        if (stageIdx < stages.length) {
          const currentStage = stages[stageIdx];
          set((current) => ({
            scanProgress: currentStage.progress,
            scanLogs: [...current.scanLogs, currentStage.log],
          }));
          stageIdx += 1;
          return;
        }

        clearInterval(timer);

        const scanId = response.scanId || state.generatedReportId;
        const nextFixed = isReScanAction ? true : get().isVulnerabilityFixed;
        const detail = await getAnalysisDetail(scanId, { fixed: nextFixed });

        set({
          isScanning: false,
          isComplete: true,
          generatedReportId: scanId,
          isVulnerabilityFixed: nextFixed,
          analysisDetail: detail,
          activeTimer: null,
        });

        if (typeof addAnalyzedProject === "function") {
          addAnalyzedProject({
            id: scanId,
            projectName: state.projectName,
            date: new Date().toISOString().split("T")[0],
            status: "검사 완료",
            targetLang: state.targetLanguage,
            totalDetected: detail.summary.totalDetected,
            cleanedCount:
              detail.summary.falsePositiveCount + detail.summary.resolvedCount,
          });
        }

        if (typeof navigateCallback === "function") navigateCallback();
      }, 600);

      set({ activeTimer: timer });
    } catch (error) {
      set((current) => ({
        isScanning: false,
        activeTimer: null,
        scanLogs: [
          ...current.scanLogs,
          error.message || "분석 요청 중 오류가 발생했습니다.",
        ],
      }));
    }
  },

  loadAnalysisDetail: async () => {
    const { generatedReportId, isVulnerabilityFixed } = get();
    if (!generatedReportId) return null;

    const detail = await getAnalysisDetail(generatedReportId, {
      fixed: isVulnerabilityFixed,
    });
    set({ analysisDetail: detail });
    return detail;
  },

  resetAnalysis: () => {
    const timer = get().activeTimer;
    if (timer) clearInterval(timer);
    set({
      isScanning: false,
      scanProgress: 0,
      scanLogs: [],
      isComplete: false,
      generatedReportId: null,
      isVulnerabilityFixed: false,
      analysisDetail: null,
      activeTimer: null,
    });
  },
}));
