export default function HospitalPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#080c18" }}>
      {children}
    </div>
  );
}
