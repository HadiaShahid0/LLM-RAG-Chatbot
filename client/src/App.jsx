import { Analytics } from '@vercel/analytics/react';
import AppRoutes from "./routes/appRoutes";

function App() {
  return (
    <>
      <AppRoutes />
      <Analytics />
    </>
  );
}

export default App;
