export default function LoadingIndicator({ text }: { text: string }) {
  return (
    <div className="flex justify-center items-center">
      <div className="spinner-border text-blue-600" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
    </div>
  );
}
