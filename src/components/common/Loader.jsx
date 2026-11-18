export default function Loader({ message = "Loading..." }) {
  return (
    <div className="app-loader" role="status" aria-live="polite">
      <span className="app-loader-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}