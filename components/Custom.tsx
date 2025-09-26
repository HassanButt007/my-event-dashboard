import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

export const showToast = (message: string, type: "success" | "error" = "success") => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-sm w-full bg-gray-800 text-white px-4 py-2 rounded shadow flex items-center justify-between`}
        style={{ borderLeft: type === "success" ? "4px solid #22c55e" : "4px solid #ef4444" }}
      >
        <span>{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)} // ✅ must use t.id here
          className="ml-4"
        >
          <IoClose size={16} className="text-white" />
        </button>
      </div>
    ),
    { duration: 3000 } // auto-dismiss after 3 seconds
  );
};