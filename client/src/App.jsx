import AppRoutes from "./routes/AppRoutes";
import CallOverlay from "./components/call/CallOverlay";
import IncomingCallPopup from "./components/call/IncomingCallPopup";
import NotificationPermissionBanner from "./components/NotificationPermissionBanner";

function App() {
  return (
    <>
      <AppRoutes />

      {/* Incoming call popup */}
      <IncomingCallPopup />

      {/* Connected / outgoing call UI */}
      <CallOverlay />

      <NotificationPermissionBanner />
    </>
  );
}

export default App;
