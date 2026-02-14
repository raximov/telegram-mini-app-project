interface LoadingStateProps {
  label?: string;
}

export const LoadingState = ({ label = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="state-card">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
};
