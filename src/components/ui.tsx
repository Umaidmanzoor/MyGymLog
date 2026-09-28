import { useAppName } from "../hooks/useAppName";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, type ReactNode } from "react";
export function Header({
  title,
  back,
  action,
}: {
  title: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const appName = useAppName();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <header className="header">
      <div className="header-tools">
        {back ? (
          <button
            aria-label="Back"
            onClick={() =>
              location.key === "default" ? navigate("/") : navigate(-1)
            }
          >
            <ArrowLeft />
          </button>
        ) : (
          <span className="wordmark">{appName}</span>
        )}
        {action}
      </div>
      <h1>{title}</h1>
    </header>
  );
}
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet">
        <div className="sheet-heading">
          <h2>{title}</h2>
          <button aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </dialog>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
export function Download({ blob, name }: { blob: Blob; name: string }) {
  return (
    <button
      onClick={() => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      Save {name}
    </button>
  );
}
