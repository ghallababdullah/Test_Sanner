import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ProtectedRoute } from "./shared/routing/ProtectedRoute";
import { HomePage } from "./modules/home/pages/HomePage";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { RegisterPage } from "./modules/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "./modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./modules/auth/pages/ResetPasswordPage";
import { TestsPage } from "./modules/tests/pages/TestsPage";
import { TestDetailsPage } from "./modules/tests/pages/TestDetailsPage";
import { CreateTestPage } from "./modules/tests/pages/CreateTestPage";
import { EditTestPage } from "./modules/tests/pages/EditTestPage";
import { AnswerKeysPage } from "./modules/tests/pages/AnswerKeysPage";
import { GradeThresholdsPage } from "./modules/tests/pages/GradeThresholdsPage";
import { AnalyticsPage } from "./modules/analytics/pages/AnalyticsPage";
import { ReviewQueuePage } from "./modules/review/pages/ReviewQueuePage";
import { BlankDetailsPage } from "./modules/review/pages/BlankDetailsPage";
import { ScanSessionsPage } from "./modules/scan/pages/ScanSessionsPage";
import { ProfilePage } from "./modules/profile/pages/ProfilePage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/tests", element: <TestsPage /> },
      { path: "/tests/create", element: <CreateTestPage /> },
      { path: "/tests/:testId", element: <TestDetailsPage /> },
      { path: "/tests/:testId/edit", element: <EditTestPage /> },
      { path: "/tests/:testId/answer-keys", element: <AnswerKeysPage /> },
      { path: "/tests/:testId/grade-thresholds", element: <GradeThresholdsPage /> },
      { path: "/tests/:testId/analytics", element: <AnalyticsPage /> },
      { path: "/tests/:testId/review", element: <ReviewQueuePage /> },
      { path: "/scan/sessions/:sessionId", element: <ScanSessionsPage /> },
      { path: "/scan/blanks/:blankId", element: <BlankDetailsPage /> },
      { path: "/profile", element: <ProfilePage /> }
    ]
  }
]);
