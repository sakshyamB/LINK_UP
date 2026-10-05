const PostSuccessPopup = ({ message, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-success-title"
      className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
    >
      <h2 id="post-success-title" className="mb-3 text-lg font-semibold text-slate-900">
        Success
      </h2>
      <p className="mb-6 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          OK
        </button>
      </div>
    </div>
  </div>
);

export default PostSuccessPopup;
