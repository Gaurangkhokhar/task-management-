export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to Task Management System</h1>
        <p className="text-lg mb-8">Organize your tasks efficiently with our comprehensive task management solution.</p>
        <h2 className="text-2xl font-bold text-blue-500 mb-8">Get Started with Task Management</h2>
        <a
          href="/login"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Login
        </a>
      </div>
    </main>
  );
}
