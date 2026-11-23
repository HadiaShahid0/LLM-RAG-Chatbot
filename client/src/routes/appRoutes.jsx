import { Routes, Route } from "react-router-dom";

import RegisterPage from "../features/auth/pages/register";
import LoginPage from "../features/auth/pages/login";
import ProtectedRoute from "./protectedRoutes";

import TenantSelectionPage from "../features/chat/pages/tenantSelectionPage.jsx";
import ChatPage from "../features/chat/pages/chatPage";
import AcceptInvitationPage from "../features/invitation/page/acceptInvitation.jsx";
const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/select-tenant"
        element={
          <ProtectedRoute>
            <TenantSelectionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accept-invitation/:token"
        element={<AcceptInvitationPage />}
      />
    </Routes>
  );
};

export default App;
