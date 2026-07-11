import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import MobileNavbar from "./MobileNavbar";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">

      <Navbar />

      <div className="max-w-7xl mx-auto flex pt-20">

        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 fixed">
          <Sidebar />
        </aside>

        {/* Feed */}
        <main className="flex-1 lg:ml-64 lg:mr-80 px-4 pb-24">
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