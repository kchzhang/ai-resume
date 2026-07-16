import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './HomeView.vue';
import SettingsPage from './SettingsPage.vue';
import PromptRulePage from './PromptRulePage.vue';
import ResumeMatchPage from './ResumeMatchPage.vue';
import ResumeDetailPage from './ResumeDetailPage.vue';
import ReportDetailPage from './ReportDetailPage.vue';
import HistoryResumeListPage from './HistoryResumeListPage.vue';
import HistoryResumeDetailPage from './HistoryResumeDetailPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/settings',
      component: SettingsPage,
      children: [
        { path: '', name: 'settings-list', component: SettingsPage },
        { path: 'add', name: 'settings-add', component: SettingsPage },
        { path: 'edit/:id', name: 'settings-edit', component: SettingsPage },
      ],
    },
    {
      path: '/prompt-rules',
      component: PromptRulePage,
      children: [
        { path: '', name: 'prompt-rules-list', component: PromptRulePage },
        { path: 'add', name: 'prompt-rules-add', component: PromptRulePage },
        { path: 'edit/:id', name: 'prompt-rules-edit', component: PromptRulePage },
      ],
    },
    { path: '/resume-match', name: 'resume-match', component: ResumeMatchPage },
    { path: '/resume-detail/:id', name: 'resume-detail', component: ResumeDetailPage },
    { path: '/report-detail/:id', name: 'report-detail', component: ReportDetailPage },
    { path: '/history-resumes', name: 'history-resumes', component: HistoryResumeListPage },
    { path: '/history-resume-detail/:id', name: 'history-resume-detail', component: HistoryResumeDetailPage },
  ],
});

export default router;
