const Loading = () => {
  return (
    <div className="flex items-center justify-center p-4" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loading;
