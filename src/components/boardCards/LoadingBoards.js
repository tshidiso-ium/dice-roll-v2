export const LoadingBoards = () => (
  <div className="flex items-center justify-center h-32">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-yellow-400 font-semibold">
        Loading boards...
      </p>
    </div>
  </div>
)