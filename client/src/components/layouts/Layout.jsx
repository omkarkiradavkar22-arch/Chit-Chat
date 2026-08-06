import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import MobileNavbar from "./MobileNavbar";

function Layout({ children, fullScreen = false }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">

      <Navbar />

      <div
        className={`max-w-screen-2xl mx-auto flex ${
          fullScreen
            ? "pt-20 h-[100dvh]"
            : "pt-20"
        }`}
      >

        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 fixed">
          <Sidebar />
        </aside>

        {/* Feed */}
         <main
          className={`flex-1 min-w-0 ${
            fullScreen
              ? "lg:ml-64 lg:mr-80 px-0 pb-0 h-full min-h-0 overflow-hidden"
              : "lg:ml-64 lg:mr-80 px-4 pb-24"
          }`}
        >
          {children}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-72 fixed right-8 top-20">
          <RightSidebar />
        </aside>

      </div>

      <MobileNavbar />

    </div>
  );
}

export default Layout;
