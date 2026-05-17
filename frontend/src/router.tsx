import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ProtectedRoute } from "./shared/routing/ProtectedRoute";
import { HomePage } from "./modules/home/pages/HomePage";
import { GuidePage } from "./modules/home/pages/GuidePage";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { RegisterPage } from "./modules/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "./modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./modules/auth/pages/ResetPasswordPage";
import { VerifyEmailResultPage } from "./modules/auth/pages/VerifyEmailResultPage";
import { TestsPage } from "./modules/tests/pages/TestsPage";
import { TestDetailsPage } from "./modules/tests/pages/TestDetailsPage";
import { CreateTestPage } from "./modules/tests/pages/CreateTestPage";
import { EditTestPage } from "./modules/tests/pages/EditTestPage";
import { AnswerKeysPage } from "./modules/tests/pages/AnswerKeysPage";
import { GradeThresholdsPage } from "./modules/tests/pages/GradeThresholdsPage";
import { AnalyticsOverviewPage } from "./modules/analytics/pages/AnalyticsOverviewPage";
import { AnalyticsPage } from "./modules/analytics/pages/AnalyticsPage";
import { ReviewHubPage } from "./modules/review/pages/ReviewHubPage";
import { ReviewQueuePage } from "./modules/review/pages/ReviewQueuePage";
import { BlankDetailsPage } from "./modules/review/pages/BlankDetailsPage";
import { RoiReviewPage } from "./modules/review/pages/RoiReviewPage";
import { RoiEditorPage } from "./modules/review/pages/RoiEditorPage";
import { ScanHubPage } from "./modules/scan/pages/ScanHubPage";
import { ScanSessionsPage } from "./modules/scan/pages/ScanSessionsPage";
import { ProfilePage } from "./modules/profile/pages/ProfilePage";
import { RouteErrorPage } from "./shared/routing/RouteErrorPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <RouteErrorPage /> },
  { path: "/guide", element: <GuidePage />, errorElement: <RouteErrorPage /> },
  { path: "/login", element: <LoginPage />, errorElement: <RouteErrorPage /> },
  { path: "/register", element: <RegisterPage />, errorElement: <RouteErrorPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage />, errorElement: <RouteErrorPage /> },
  { path: "/reset-password", element: <ResetPasswordPage />, errorElement: <RouteErrorPage /> },
  { path: "/verify-email-result", element: <VerifyEmailResultPage />, errorElement: <RouteErrorPage /> },
  {
    errorElement: <RouteErrorPage />,
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
      { path: "/analytics", element: <AnalyticsOverviewPage /> },
      { path: "/review", element: <ReviewHubPage /> },
      { path: "/tests/:testId/analytics", element: <AnalyticsPage /> },
      { path: "/tests/:testId/review", element: <ReviewQueuePage /> },
      { path: "/scan", element: <ScanHubPage /> },
      { path: "/scan/sessions/:sessionId", element: <ScanSessionsPage /> },
      { path: "/scan/blanks/:blankId", element: <BlankDetailsPage /> },
      { path: "/scan/blanks/:blankId/roi-review", element: <RoiReviewPage /> },
      { path: "/scan/blanks/:blankId/roi-editor", element: <RoiEditorPage /> },
      { path: "/profile", element: <ProfilePage /> }
    ]
  }
]);
