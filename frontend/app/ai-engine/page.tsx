export default function AIEnginePage() {
    return (
        <div className="w-full h-screen">
            <iframe
                src="http://localhost:5001"
                className="w-full h-full border-none"
            />
        </div>
    );
}