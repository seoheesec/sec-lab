import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const initialProject = {
  id: "SCAN-092",
  projectName: "ai-code-scanner-core-audit",
  date: "2026-05-30",
  status: "검사 완료",
  targetLang: "Python",
  totalDetected: 2,
  cleanedCount: 1,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isGithubConnected: false,
      githubUser: null,
      loginAttempts: 0,
      isLocked: false,
      analyzedProjects: [initialProject],

      login: (userData, accessToken) =>
        set({
          user: userData,
          token: accessToken,
          isLoggedIn: true,
          loginAttempts: 0,
          isLocked: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isGithubConnected: false,
          githubUser: null,
          loginAttempts: 0,
          isLocked: false,
        }),

      incrementLoginAttempts: () =>
        set((state) => {
          const nextAttempts = state.loginAttempts + 1;
          return {
            loginAttempts: nextAttempts,
            isLocked: nextAttempts >= 5,
          };
        }),

      resetLoginAttempts: () =>
        set({
          loginAttempts: 0,
          isLocked: false,
        }),

      setGithubConnection: (isConnected, githubData = null) =>
        set({
          isGithubConnected: isConnected,
          githubUser: githubData,
        }),

      addAnalyzedProject: (newProject) =>
        set((state) => ({
          analyzedProjects: [newProject, ...state.analyzedProjects],
        })),
    }),
    {
      name: "securelens-auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        isGithubConnected: state.isGithubConnected,
        githubUser: state.githubUser,
        analyzedProjects: state.analyzedProjects,
      }),
    },
  ),
);
