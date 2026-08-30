import AppRoutes from "./routes/AppRoutes";
import CallOverlay from "./components/call/CallOverlay";
import NotificationPermissionBanner from "./components/NotificationPermissionBanner";

function App() {
  return (
    <>
      <AppRoutes />
      <CallOverlay />
      <NotificationPermissionBanner />
    </>
  );
}

export default App;
