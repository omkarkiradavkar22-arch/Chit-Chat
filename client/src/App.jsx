import AppRoutes from "./routes/AppRoutes";
import CallOverlay from "./components/call/CallOverlay";
import NotificationPermissionBanner from "./components/NotificationPermissionBanner";
import OfflineBanner from "./components/OfflineBanner";
import { Toaster } from "react-hot-toast";

function App() {
 return (
  <>
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2000,
        style: {
          zIndex: 999999,
        },
      }}
    />

    <OfflineBanner />

    <AppRoutes />

    {/* Connected / outgoing call UI */}
    <CallOverlay />

    <NotificationPermissionBanner />
  </>
);
}

export default App;
