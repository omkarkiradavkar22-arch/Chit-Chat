import AppRoutes from "./routes/AppRoutes";
import CallOverlay from "./components/call/CallOverlay";
import NotificationPermissionBanner from "./components/NotificationPermissionBanner";
import OfflineBanner from "./components/OfflineBanner";

function App() {
  return (
    <>
     <OfflineBanner />
     
      <AppRoutes />
      {/* Connected / outgoing call UI */}
      <CallOverlay />

      <NotificationPermissionBanner />
    </>
  );
}

export default App;
