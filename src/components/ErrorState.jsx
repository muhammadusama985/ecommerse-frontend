function ErrorState({ message = "Something went wrong while loading data." }) {
  return <div className="error-state">{message}</div>;
}

export { ErrorState };
