import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";

export default function RouteError() {
  const err = useRouteError();

  if (isRouteErrorResponse(err)) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Route Error: {err.status}</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{err.statusText}</pre>
        <Link to="/">Home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>App Error</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {String(err?.message ?? err)}
      </pre>
      <Link to="/">Home</Link>
    </div>
  );
}