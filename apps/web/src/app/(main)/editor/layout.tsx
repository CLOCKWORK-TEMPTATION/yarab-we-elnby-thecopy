import "./src/styles/system.css";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 9999 }}
      data-editor-root="true"
    >
      {children}
    </div>
  );
}
